import { safeHttp } from '@activepieces/server-utils'
import { isNil, SecurityAdvisory } from '@activepieces/shared'
import { isAxiosError } from 'axios'
import { FastifyBaseLogger } from 'fastify'

const GITHUB_ADVISORIES_URL = 'https://api.github.com/repos/activepieces/activepieces/security-advisories'
const REQUEST_TIMEOUT_MS = 5000
// Single-page fetch capped at 100 — the Activepieces repo is not expected to exceed this. If it
// ever does, the oldest advisories will be silently dropped; add Link-header pagination here.
const PER_PAGE = 100
const TARGET_PACKAGE_NAME = 'activepieces'

const isAllowedSeverity = (s: string): s is SecurityAdvisory['severity'] =>
    s === 'low' || s === 'medium' || s === 'high' || s === 'critical'

export const githubAdvisorySource = {
    async fetch({ log, currentVersion }: FetchParams): Promise<SecurityAdvisory[] | null> {
        try {
            const response = await safeHttp.retryingAxios.get<GithubAdvisory[]>(GITHUB_ADVISORIES_URL, {
                params: { state: 'published', per_page: PER_PAGE },
                headers: {
                    'User-Agent': `activepieces-server/${currentVersion}`,
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
                timeout: REQUEST_TIMEOUT_MS,
            })
            return normalizeAdvisories(response.data)
        }
        catch (error) {
            log.warn(summarizeError(error), 'Failed to fetch GitHub security advisories')
            return null
        }
    },
}

const summarizeError = (error: unknown): Record<string, unknown> => {
    if (isAxiosError(error)) {
        return {
            source: 'github',
            status: error.response?.status,
            code: error.code,
            message: error.message,
            url: error.config?.url,
        }
    }
    return {
        source: 'github',
        message: error instanceof Error ? error.message : String(error),
    }
}

const normalizeAdvisories = (raw: GithubAdvisory[] | undefined | null): SecurityAdvisory[] => {
    if (!Array.isArray(raw)) return []
    const advisories: SecurityAdvisory[] = []
    for (const entry of raw) {
        const advisory = mapAdvisory(entry)
        if (!isNil(advisory)) advisories.push(advisory)
    }
    return advisories
}

const mapAdvisory = (entry: GithubAdvisory): SecurityAdvisory | null => {
    if (isNil(entry?.ghsa_id) || isNil(entry?.summary) || isNil(entry?.html_url)) return null
    const severity = entry.severity?.toLowerCase()
    if (!severity || !isAllowedSeverity(severity)) return null
    const vulnerability = pickActivepiecesVulnerability(entry.vulnerabilities)
    if (isNil(vulnerability) || isNil(vulnerability.vulnerable_version_range)) return null
    return {
        id: `github:${entry.ghsa_id}`,
        source: 'github',
        ghsaId: entry.ghsa_id,
        cveId: entry.cve_id ?? null,
        summary: entry.summary,
        description: entry.description ?? '',
        severity,
        cvssScore: entry.cvss?.score ?? null,
        vulnerableVersionRange: normalizeRange(vulnerability.vulnerable_version_range),
        patchedVersion: vulnerability.patched_versions ?? null,
        publishedAt: entry.published_at ?? entry.updated_at ?? new Date(0).toISOString(),
        updatedAt: entry.updated_at ?? entry.published_at ?? new Date(0).toISOString(),
        htmlUrl: entry.html_url,
    }
}

const pickActivepiecesVulnerability = (vulnerabilities: GithubVulnerability[] | undefined): GithubVulnerability | undefined => {
    if (!Array.isArray(vulnerabilities) || vulnerabilities.length === 0) return undefined
    const named = vulnerabilities.find((v) => v?.package?.name === TARGET_PACKAGE_NAME)
    return named ?? vulnerabilities[0]
}

const normalizeRange = (range: string): string => range.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()

type FetchParams = {
    log: FastifyBaseLogger
    currentVersion: string
}

type GithubVulnerability = {
    package?: { ecosystem?: string, name?: string }
    vulnerable_version_range?: string
    patched_versions?: string | null
}

type GithubAdvisory = {
    ghsa_id?: string
    cve_id?: string | null
    summary?: string
    description?: string
    severity?: string
    cvss?: { score?: number | null }
    vulnerabilities?: GithubVulnerability[]
    published_at?: string
    updated_at?: string
    html_url?: string
}
