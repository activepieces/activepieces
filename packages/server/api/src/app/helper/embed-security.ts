import { ApEdition, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { embedSubdomainService } from '../ee/embed-subdomain/embed-subdomain.service'
import { platformService } from '../platform/platform.service'
import { system } from './system/system'

const CACHE_MAX_ENTRIES = 1000
const CACHE_TTL_MS = 3 * 60 * 1000
const SELF_HOSTED_CACHE_KEY = '__self_hosted__'

const cache: LRU<string[]> = lru(CACHE_MAX_ENTRIES, CACHE_TTL_MS)

function buildFrameAncestorsHeader({ domains }: { domains: string[] }): string {
    if (domains.length === 0) {
        return 'frame-ancestors \'self\''
    }
    return `frame-ancestors 'self' ${domains.join(' ')}`
}

async function resolveAllowedDomains({ hostname, log }: { hostname: string, log: FastifyBaseLogger }): Promise<string[]> {
    const edition = system.getEdition()
    const cacheKey = edition === ApEdition.CLOUD ? hostname : SELF_HOSTED_CACHE_KEY

    const hit = cache.get(cacheKey)
    if (!isNil(hit)) {
        return hit
    }
    try {
        if (edition === ApEdition.CLOUD) {
            const record = await embedSubdomainService(log).getByHostname({ hostname })
            if (isNil(record)) {
                cache.set(cacheKey, [])
                return []
            }
            const platform = await platformService(log).getOneOrThrow(record.platformId)
            const domains = platform.allowedEmbedDomains ?? []
            cache.set(cacheKey, domains)
            return domains
        }

        const platform = await platformService(log).getOldestPlatform()
        if (isNil(platform)) {
            cache.set(cacheKey, [])
            return []
        }
        const domains = platform.allowedEmbedDomains ?? []
        cache.set(cacheKey, domains)
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
