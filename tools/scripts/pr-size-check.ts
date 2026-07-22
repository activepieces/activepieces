import { execSync } from 'child_process'
import { appendFileSync } from 'fs'

// Generated / machine-authored files never count toward review size.
const EXCLUDE_PATTERNS: RegExp[] = [
    /(^|\/)bun\.lock$/,
    /(^|\/)package-lock\.json$/,
    /\/i18n\/translation\.json$/,
    /^packages\/web\/public\/locales\//,
    /\.snap$/,
    /(^|\/)dist\//,
]

// First matching bucket wins; `budget: null` means the area is exempt (measured, never gated).
// packages/pieces is exempt on purpose: line count can't tell a cohesive new piece from a
// codemod or a schema dump, and pieces are @pieces-owned, self-contained, and low blast radius.
const BUCKETS: SizeBucket[] = [
    {
        name: 'engine / worker / execution',
        tests: [/^packages\/server\/engine\//, /^packages\/server\/worker\//, /^packages\/core\/execution\//],
        budget: 300,
    },
    { name: 'core/shared', tests: [/^packages\/core\/shared\//], budget: 250 },
    { name: 'server/api', tests: [/^packages\/server\/api\//], budget: 600 },
    { name: 'packages/web', tests: [/^packages\/web\//], budget: 1200 },
    { name: 'packages/pieces', tests: [/^packages\/pieces\//], budget: null },
]

const DEFAULT_BUCKET: SizeBucket = { name: 'other (default)', tests: [], budget: 400 }
const BYPASS_LABEL = 'large-pr-ok'

function resolveRenamePath({ raw }: { raw: string }): string {
    if (!raw.includes(' => ')) {
        return raw
    }
    const braced = /^(.*)\{(.*) => (.*)\}(.*)$/.exec(raw)
    if (braced) {
        const [, prefix, , to, suffix] = braced
        return `${prefix}${to}${suffix}`.replace(/\/{2,}/g, '/')
    }
    const [, , to] = /^(.*) => (.*)$/.exec(raw) ?? []
    return to ?? raw
}

function isExcluded({ path }: { path: string }): boolean {
    return EXCLUDE_PATTERNS.some((pattern) => pattern.test(path))
}

function bucketFor({ path }: { path: string }): SizeBucket {
    const match = BUCKETS.find((bucket) => bucket.tests.some((test) => test.test(path)))
    return match ?? DEFAULT_BUCKET
}

function collectSizes({ numstat }: { numstat: string }): SizeReport {
    const totals = new Map<string, number>()
    let meaningfulTotal = 0
    let excludedTotal = 0

    for (const line of numstat.split('\n')) {
        if (line.trim() === '') {
            continue
        }
        const [added, deleted, ...rest] = line.split('\t')
        const changes = Number(added) + Number(deleted)
        if (!Number.isFinite(changes)) {
            continue // binary files report "-" for counts
        }
        const path = resolveRenamePath({ raw: rest.join('\t') })
        if (isExcluded({ path })) {
            excludedTotal += changes
            continue
        }
        meaningfulTotal += changes
        const bucket = bucketFor({ path })
        totals.set(bucket.name, (totals.get(bucket.name) ?? 0) + changes)
    }

    const rows: SizeRow[] = [...BUCKETS, DEFAULT_BUCKET].map((bucket) => {
        const lines = totals.get(bucket.name) ?? 0
        const over = bucket.budget !== null && lines > bucket.budget
        return { name: bucket.name, lines, budget: bucket.budget, over }
    })

    return { rows, meaningfulTotal, excludedTotal }
}

function statusText({ row }: { row: SizeRow }): string {
    if (row.budget === null) {
        return `${row.lines.toLocaleString()} · exempt`
    }
    return row.over
        ? `⚠️ ${row.lines.toLocaleString()} / ${row.budget.toLocaleString()} — over by ${(row.lines - row.budget).toLocaleString()}`
        : `✅ ${row.lines.toLocaleString()} / ${row.budget.toLocaleString()}`
}

function renderSummary({ report, bypassReason }: { report: SizeReport, bypassReason: string | null }): string {
    const overRows = report.rows.filter((row) => row.over)
    const lines: string[] = []
    lines.push('## PR size check — advisory (not enforced)')
    lines.push('')
    lines.push('Meaningful lines = additions + deletions, excluding generated files (lockfiles, translations, locales, snapshots, dist).')
    lines.push('')
    lines.push('| Area | Meaningful / budget |')
    lines.push('| --- | --- |')
    for (const row of report.rows) {
        lines.push(`| ${row.name} | ${statusText({ row })} |`)
    }
    lines.push('')
    lines.push(`**Total meaningful:** ${report.meaningfulTotal.toLocaleString()} · **excluded (generated):** ${report.excludedTotal.toLocaleString()}`)
    lines.push('')
    if (bypassReason !== null) {
        lines.push(`🏷️ ${bypassReason} — this PR would be exempt from blocking once the gate is enforced.`)
        lines.push('')
    }
    if (overRows.length > 0) {
        lines.push(`> Heads-up: ${overRows.map((row) => row.name).join(', ')} exceed the review-size budget. This is advisory for now — consider splitting into a stack of smaller PRs (see CONTRIBUTING.md). When enforced, add the \`${BYPASS_LABEL}\` label to bypass.`)
    }
    else {
        lines.push('> All gated areas are within budget. 👍')
    }
    return lines.join('\n')
}

function main(): void {
    const baseRef = process.env.GITHUB_BASE_REF ?? 'main'
    const labels: string[] = JSON.parse(process.env.PR_LABELS ?? '[]')
    const title = process.env.PR_TITLE ?? ''

    const numstat = execSync(`git diff --numstat "origin/${baseRef}...HEAD"`, {
        encoding: 'utf-8',
        maxBuffer: 256 * 1024 * 1024,
    })
    const report = collectSizes({ numstat })

    const revert = /^revert/i.test(title)
    const bypassReason = labels.includes(BYPASS_LABEL)
        ? `\`${BYPASS_LABEL}\` label present`
        : revert
            ? 'revert PR'
            : null

    const summary = renderSummary({ report, bypassReason })
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`)
    }
    // Advisory mode: report only, never fail the check.
}

type SizeBucket = {
    name: string
    tests: RegExp[]
    budget: number | null
}

type SizeRow = {
    name: string
    lines: number
    budget: number | null
    over: boolean
}

type SizeReport = {
    rows: SizeRow[]
    meaningfulTotal: number
    excludedTotal: number
}

export const prSizeCheck = { collectSizes, renderSummary, bucketFor, resolveRenamePath }

if (import.meta.main) {
    main()
}
