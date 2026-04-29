import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { embedSubdomainService } from '../ee/embed-subdomain/embed-subdomain.service'

const CACHE_MAX_ENTRIES = 1000
const CACHE_TTL_MS = 3 * 60 * 1000

const cache: LRU<string[]> = lru(CACHE_MAX_ENTRIES, CACHE_TTL_MS)

function buildFrameAncestorsHeader({ domains }: { domains: string[] }): string {
    if (domains.length === 0) {
        return 'frame-ancestors \'self\''
    }
    return `frame-ancestors 'self' ${domains.join(' ')}`
}

async function resolveAllowedDomains({ hostname, log }: { hostname: string, log: FastifyBaseLogger }): Promise<string[]> {
    const hit = cache.get(hostname)
    if (!isNil(hit)) {
        return hit
    }
    try {
        const record = await embedSubdomainService(log).getByHostname({ hostname })
        const domains = record?.allowedEmbedDomains ?? []
        cache.set(hostname, domains)
        return domains
    }
    catch (e) {
        log.warn({ error: e, hostname }, 'Failed to resolve embed allowed domains')
        return []
    }
}

export const embedSecurity = (log: FastifyBaseLogger) => ({
    async getFrameAncestorsHeader({ hostname }: { hostname: string }): Promise<string> {
        const domains = await resolveAllowedDomains({ hostname, log })
        return buildFrameAncestorsHeader({ domains })
    },
})
