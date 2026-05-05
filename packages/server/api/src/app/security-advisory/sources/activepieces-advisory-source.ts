import { safeHttp } from '@activepieces/server-utils'
import { isNil, SecurityAdvisory } from '@activepieces/shared'
import { isAxiosError } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

const REQUEST_TIMEOUT_MS = 10000

export const activepiecesAdvisorySource = {
    async fetch({ log, currentVersion }: FetchParams): Promise<SecurityAdvisory[] | null> {
        const feedUrl = system.get(AppSystemProp.SECURITY_ADVISORIES_FEED_URL)
        if (isNil(feedUrl)) {
            log.debug({ source: 'activepieces' }, 'Activepieces security-advisories feed URL is not configured; skipping')
            return []
        }
        try {
            const response = await safeHttp.retryingAxios.get<unknown>(feedUrl, {
                headers: {
                    'User-Agent': `activepieces-server/${currentVersion}`,
                    Accept: 'application/json',
                },
                timeout: REQUEST_TIMEOUT_MS,
            })
            return normalizeAdvisories({ raw: response.data, log })
        }
        catch (error) {
            log.warn(summarizeError(error), 'Failed to fetch Activepieces security-advisories feed')
            return null
        }
    },
}

const normalizeAdvisories = ({ raw, log }: { raw: unknown, log: FastifyBaseLogger }): SecurityAdvisory[] => {
    const entries = unwrapResponse(raw)
    if (!Array.isArray(entries)) {
        log.warn({ source: 'activepieces' }, 'Activepieces advisory feed did not return an array')
        return []
    }
    const advisories: SecurityAdvisory[] = []
    for (const entry of entries) {
        const result = SecurityAdvisory.safeParse(coerceEntry(entry))
        if (result.success) {
            advisories.push(result.data)
            continue
        }
        log.warn({ source: 'activepieces', issues: result.error.issues }, 'Skipping malformed advisory entry')
    }
    return advisories
}

const unwrapResponse = (raw: unknown): unknown => {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return raw
    const candidate = (raw as Record<string, unknown>).body
    return Array.isArray(candidate) ? candidate : raw
}

const coerceEntry = (entry: unknown): unknown => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return entry
    const e = entry as Record<string, unknown>
    const next: Record<string, unknown> = { ...e, id: namespaceId(e.id) }
    if (typeof e.cvssScore === 'string') {
        const trimmed = e.cvssScore.trim()
        if (trimmed === '') {
            next.cvssScore = null
        }
        else {
            const parsed = Number(trimmed)
            if (!Number.isNaN(parsed)) next.cvssScore = parsed
        }
    }
    return next
}

export const activepiecesAdvisorySourceHelpers = { unwrapResponse, coerceEntry }

const namespaceId = (id: unknown): unknown => {
    if (typeof id !== 'string') return id
    return id.startsWith('activepieces:') ? id : `activepieces:${id}`
}

const summarizeError = (error: unknown): Record<string, unknown> => {
    if (isAxiosError(error)) {
        return {
            source: 'activepieces',
            status: error.response?.status,
            code: error.code,
            message: error.message,
            url: error.config?.url,
        }
    }
    return {
        source: 'activepieces',
        message: error instanceof Error ? error.message : String(error),
    }
}

type FetchParams = {
    log: FastifyBaseLogger
    currentVersion: string
}
