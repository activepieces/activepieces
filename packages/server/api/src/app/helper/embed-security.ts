import { ApEdition, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { embedSubdomainService } from '../ee/embed-subdomain/embed-subdomain.service'
import { platformService } from '../platform/platform.service'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

const CACHE_MAX_ENTRIES = 1000
const CACHE_TTL_MS = 3 * 60 * 1000
const SELF_HOSTED_CACHE_KEY = '__self_hosted__'

const cache: LRU<string[]> = lru(CACHE_MAX_ENTRIES, CACHE_TTL_MS)

function buildFrameAncestorsHeader({ origins }: { origins: string[] }): string {
    if (origins.length === 0) {
        return 'frame-ancestors \'self\''
    }
    return `frame-ancestors 'self' ${origins.join(' ')}`
}

async function resolveAllowedOrigins({ hostname, log }: { hostname: string, log: FastifyBaseLogger }): Promise<string[]> {
    const edition = system.getEdition()
    const cacheKey = edition === ApEdition.CLOUD ? hostname : SELF_HOSTED_CACHE_KEY

    const hit = cache.get(cacheKey)
    if (!isNil(hit)) {
        return hit
    }
    const envOrigins = system.getList(AppSystemProp.ALLOWED_EMBED_ORIGINS).filter(isValidOrigin)

    try {
        if (edition === ApEdition.CLOUD) {
            const record = await embedSubdomainService(log).getByHostname({ hostname })
            if (isNil(record)) {
                cache.set(cacheKey, envOrigins)
                return envOrigins
            }
            const platform = await platformService(log).getOneOrThrow(record.platformId)
            const origins = mergeUnique(platform.allowedEmbedOrigins ?? [], envOrigins)
            cache.set(cacheKey, origins)
            return origins
        }

        const platform = await platformService(log).getOldestPlatform()
        if (isNil(platform)) {
            cache.set(cacheKey, envOrigins)
            return envOrigins
        }
        const origins = mergeUnique(platform.allowedEmbedOrigins ?? [], envOrigins)
        cache.set(cacheKey, origins)
        return origins
    }
    catch (e) {
        log.warn({ error: e, hostname }, 'Failed to resolve embed allowed origins')
        return envOrigins
    }
}

function mergeUnique(a: string[], b: string[]): string[] {
    return Array.from(new Set([...a, ...b]))
}

function isValidOrigin(value: string): boolean {
    try {
        return new URL(value).origin === value
    }
    catch {
        return false
    }
}

export const embedSecurity = (log: FastifyBaseLogger) => ({
    async getFrameAncestorsHeader({ hostname }: { hostname: string }): Promise<string> {
        const origins = await resolveAllowedOrigins({ hostname, log })
        return buildFrameAncestorsHeader({ origins })
    },
})
