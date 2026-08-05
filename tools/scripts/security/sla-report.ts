import * as fs from 'fs'
import * as path from 'path'

const SLA_DAYS: Record<Severity, number | null> = {
    critical: 7,
    high: 30,
    medium: 90,
    low: null,
}

const DUE_SOON_DAYS: Record<Severity, number> = {
    critical: 2,
    high: 7,
    medium: 14,
    low: 0,
}

const STATUS_ORDER: Record<SlaStatus, number> = {
    BREACHED: 0,
    DUE_SOON: 1,
    ON_TRACK: 2,
    BEST_EFFORT: 3,
    NEEDS_TRIAGE: 4,
}

const RESOLVED_STATES = new Set(['closed', 'published', 'withdrawn', 'fixed', 'dismissed', 'auto_dismissed'])

const MS_PER_DAY = 24 * 60 * 60 * 1000

function main(): void {
    const args = parseArgs(process.argv.slice(2))
    const now = args.now ? new Date(args.now) : new Date()
    if (Number.isNaN(now.getTime())) {
        fail(`Invalid --now value: ${args.now}`)
    }

    const advisories = args.source === 'dependabot'
        ? []
        : readSourceFile({ file: args.advisories, label: 'advisories' }).map((raw) => normalizeAdvisory(raw))
    const dependabot = args.source === 'advisory'
        ? []
        : readSourceFile({ file: args.dependabot, label: 'dependabot' }).map((raw) => normalizeDependabot(raw))

    const allItems = [...advisories, ...dependabot]
    const items = filterByState({ items: allItems, stateFilter: args.state })
    const dropped = allItems.length - items.length
    if (dropped > 0) {
        console.warn(`[info] excluded ${dropped} resolved/filtered item(s) by state; ${items.length} remaining.`)
    }
    if (items.length === 0) {
        console.log('No advisories or Dependabot alerts found (after state filter). Nothing to report.')
        return
    }

    const rows = items
        .map((item) => buildRow({ item, now }))
        .sort(compareRows)

    fs.mkdirSync(args.out, { recursive: true })
    const jsonPath = path.join(args.out, 'sla.json')
    const dashboardPath = path.join(args.out, 'dashboard.md')
    const dashboard = renderDashboard({ rows, now })

    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2))
    fs.writeFileSync(dashboardPath, dashboard)

    console.log(dashboard)
    console.log(`\nWrote ${rows.length} row(s) to ${jsonPath} and ${dashboardPath}`)
}

function parseArgs(argv: string[]): CliArgs {
    const out: CliArgs = {
        advisories: '.security-triage/advisories.json',
        dependabot: '.security-triage/dependabot.json',
        out: '.security-triage',
        now: undefined,
        source: 'all',
        state: undefined,
    }
    for (let i = 0; i < argv.length; i += 2) {
        const flag = argv[i]
        const value = argv[i + 1]
        if (value === undefined) {
            fail(`Missing value for ${flag}`)
        }
        switch (flag) {
            case '--advisories':
                out.advisories = value
                break
            case '--dependabot':
                out.dependabot = value
                break
            case '--out':
                out.out = value
                break
            case '--now':
                out.now = value
                break
            case '--source':
                out.source = toSourceFilter(value)
                break
            case '--state':
                out.state = value
                break
            default:
                fail(`Unknown flag: ${flag}`)
        }
    }
    return out
}

function readSourceFile({ file, label }: { file: string, label: string }): Record<string, unknown>[] {
    if (!fs.existsSync(file)) {
        console.warn(`[warn] ${label} file not found at ${file} — skipping that source.`)
        return []
    }
    // `gh api --paginate` concatenates one JSON array per page (`[...]\n[...]`), which is not itself
    // valid JSON. Scan out each top-level value (string-aware so brackets in text don't fool us).
    const raw = fs.readFileSync(file, 'utf-8')
    const pages: unknown[] = []
    let depth = 0, inString = false, escaped = false, start = -1
    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i]
        if (inString) {
            if (escaped) escaped = false
            else if (ch === '\\') escaped = true
            else if (ch === '"') inString = false
        }
        else if (ch === '"') inString = true
        else if (ch === '[' || ch === '{') { if (depth++ === 0) start = i }
        else if ((ch === ']' || ch === '}') && --depth === 0 && start >= 0) {
            pages.push(JSON.parse(raw.slice(start, i + 1)))
            start = -1
        }
    }
    if (depth !== 0 || pages.length === 0) {
        fail(`${label} file ${file} must contain JSON array(s) from 'gh api ... --paginate'.`)
    }
    return pages.flatMap((page) => {
        if (!Array.isArray(page)) {
            fail(`${label} file ${file} has a non-array top-level JSON value.`)
        }
        return page
    }).map((entry) => asRecord(entry))
}

function filterByState({ items, stateFilter }: { items: TriageItem[], stateFilter: string | undefined }): TriageItem[] {
    if (stateFilter === undefined) {
        return items.filter((item) => item.state === null || !RESOLVED_STATES.has(item.state))
    }
    if (stateFilter === 'all') {
        return items
    }
    const allowed = new Set(stateFilter.split(',').map((s) => s.trim()).filter((s) => s.length > 0))
    return items.filter((item) => item.state !== null && allowed.has(item.state))
}

function normalizeAdvisory(raw: Record<string, unknown>): TriageItem {
    const cvss = raw.cvss !== undefined && raw.cvss !== null ? asRecord(raw.cvss) : undefined
    return {
        source: 'advisory',
        id: asStringOrNull(raw.ghsa_id) ?? asStringOrNull(raw.cve_id) ?? 'unknown',
        ghsaId: asStringOrNull(raw.ghsa_id),
        cveId: asStringOrNull(raw.cve_id),
        severity: toSeverity(raw.severity),
        summary: asStringOrNull(raw.summary) ?? '(no summary)',
        createdAt: asStringOrNull(raw.created_at),
        htmlUrl: asStringOrNull(raw.html_url) ?? '',
        cvssScore: cvss ? asNumberOrNull(cvss.score) : null,
        state: asStringOrNull(raw.state),
    }
}

function normalizeDependabot(raw: Record<string, unknown>): TriageItem {
    const advisory = raw.security_advisory !== undefined && raw.security_advisory !== null
        ? asRecord(raw.security_advisory)
        : undefined
    const vuln = raw.security_vulnerability !== undefined && raw.security_vulnerability !== null
        ? asRecord(raw.security_vulnerability)
        : undefined
    const pkg = vuln?.package !== undefined && vuln.package !== null ? asRecord(vuln.package) : undefined
    const packageName = pkg ? asStringOrNull(pkg.name) : null
    const number = asNumberOrNull(raw.number)
    const summary = advisory ? asStringOrNull(advisory.summary) : null
    return {
        source: 'dependabot',
        id: number !== null ? `dependabot-${number}` : (advisory ? asStringOrNull(advisory.ghsa_id) ?? 'unknown' : 'unknown'),
        ghsaId: advisory ? asStringOrNull(advisory.ghsa_id) : null,
        cveId: advisory ? asStringOrNull(advisory.cve_id) : null,
        severity: toSeverity(vuln?.severity ?? advisory?.severity),
        summary: packageName ? `${packageName}: ${summary ?? '(no summary)'}` : (summary ?? '(no summary)'),
        createdAt: asStringOrNull(raw.created_at),
        htmlUrl: asStringOrNull(raw.html_url) ?? '',
        cvssScore: null,
        state: asStringOrNull(raw.state),
    }
}

function buildRow({ item, now }: { item: TriageItem, now: Date }): SlaRow {
    const created = item.createdAt ? new Date(item.createdAt) : null
    const createdValid = created !== null && !Number.isNaN(created.getTime())

    if (item.severity === null) {
        return { ...item, deadline: null, daysLeft: null, status: 'NEEDS_TRIAGE' }
    }

    const slaDays = SLA_DAYS[item.severity]
    if (slaDays === null) {
        return { ...item, deadline: null, daysLeft: null, status: 'BEST_EFFORT' }
    }

    if (!createdValid) {
        return { ...item, deadline: null, daysLeft: null, status: 'NEEDS_TRIAGE' }
    }

    const deadline = new Date(created.getTime() + slaDays * MS_PER_DAY)
    const daysLeft = Math.floor((deadline.getTime() - now.getTime()) / MS_PER_DAY)
    const status = computeStatus({ severity: item.severity, daysLeft })
    return { ...item, deadline: deadline.toISOString(), daysLeft, status }
}

function computeStatus({ severity, daysLeft }: { severity: Severity, daysLeft: number }): SlaStatus {
    if (daysLeft < 0) {
        return 'BREACHED'
    }
    if (daysLeft <= DUE_SOON_DAYS[severity]) {
        return 'DUE_SOON'
    }
    return 'ON_TRACK'
}

function compareRows(a: SlaRow, b: SlaRow): number {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) {
        return byStatus
    }
    const aLeft = a.daysLeft ?? Number.MAX_SAFE_INTEGER
    const bLeft = b.daysLeft ?? Number.MAX_SAFE_INTEGER
    return aLeft - bLeft
}

function renderDashboard({ rows, now }: { rows: SlaRow[], now: Date }): string {
    const counts = countByStatus(rows)
    const summary = (Object.keys(STATUS_ORDER) as SlaStatus[])
        .filter((status) => (counts[status] ?? 0) > 0)
        .map((status) => `${status}: ${counts[status]}`)
        .join(' | ')

    const header = '| Status | Severity | Source | ID | Summary | Created | Deadline | Days left | Link |'
    const divider = '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
    const lines = rows.map((row) => {
        const cells = [
            row.status,
            row.severity ?? 'unscored',
            row.source,
            row.cveId ?? row.ghsaId ?? row.id,
            truncate(row.summary.replace(/\|/g, '\\|'), 70),
            formatDate(row.createdAt),
            formatDate(row.deadline),
            row.daysLeft === null ? '—' : String(row.daysLeft),
            row.htmlUrl ? `[link](${row.htmlUrl})` : '',
        ]
        return `| ${cells.join(' | ')} |`
    })

    return [
        `# Security Advisory SLA Dashboard`,
        ``,
        `Generated: ${now.toISOString()}`,
        `Total: ${rows.length} — ${summary}`,
        ``,
        `SLA: Critical 7d, High 30d, Medium 90d (from report/alert creation date). Low = best-effort.`,
        ``,
        header,
        divider,
        ...lines,
    ].join('\n')
}

function countByStatus(rows: SlaRow[]): Partial<Record<SlaStatus, number>> {
    return rows.reduce<Partial<Record<SlaStatus, number>>>((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1
        return acc
    }, {})
}

function toSourceFilter(value: string): SourceFilter {
    if (value === 'advisory' || value === 'dependabot' || value === 'all') {
        return value
    }
    fail(`Invalid --source value: ${value} (expected advisory | dependabot | all)`)
}

function toSeverity(value: unknown): Severity | null {
    if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
        return value
    }
    return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> {
    if (!isRecord(value)) {
        fail(`Expected an object but got: ${JSON.stringify(value)}`)
    }
    return value
}

function asStringOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null
}

function asNumberOrNull(value: unknown): number | null {
    return typeof value === 'number' ? value : null
}

function formatDate(iso: string | null): string {
    return iso ? iso.slice(0, 10) : '—'
}

function truncate(value: string, max: number): string {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function fail(message: string): never {
    console.error(`[sla-report] ${message}`)
    process.exit(1)
}

main()

type Severity = 'critical' | 'high' | 'medium' | 'low'

type SlaStatus = 'BREACHED' | 'DUE_SOON' | 'ON_TRACK' | 'BEST_EFFORT' | 'NEEDS_TRIAGE'

type SourceFilter = 'advisory' | 'dependabot' | 'all'

type CliArgs = {
    advisories: string
    dependabot: string
    out: string
    now: string | undefined
    source: SourceFilter
    state: string | undefined
}

type TriageItem = {
    source: 'advisory' | 'dependabot'
    id: string
    ghsaId: string | null
    cveId: string | null
    severity: Severity | null
    summary: string
    createdAt: string | null
    htmlUrl: string
    cvssScore: number | null
    state: string | null
}

type SlaRow = TriageItem & {
    deadline: string | null
    daysLeft: number | null
    status: SlaStatus
}
