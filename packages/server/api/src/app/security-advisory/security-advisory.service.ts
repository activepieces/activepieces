import { apVersionUtil } from '@activepieces/server-utils'
import { GetSecurityAdvisoriesResponse, SecurityAdvisory, tryCatchSync } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import semver from 'semver'
import { activepiecesAdvisorySource } from './sources/activepieces-advisory-source'
import { githubAdvisorySource } from './sources/github-advisory-source'

const CACHE_TTL_MS = 15 * 60 * 1000

let cache: CacheEntry | null = null
let inflight: Promise<GetSecurityAdvisoriesResponse> | null = null

export const securityAdvisoryService = (log: FastifyBaseLogger) => ({
    async listForCurrentVersion(): Promise<GetSecurityAdvisoriesResponse> {
        const currentVersion = apVersionUtil.getCurrentRelease()
        const cached = readCache(currentVersion)
        if (cached) return cached
        if (inflight) return inflight

        inflight = (async () => {
            try {
                const [githubAdvisories, activepiecesAdvisories] = await Promise.all([
                    githubAdvisorySource.fetch({ log, currentVersion }),
                    activepiecesAdvisorySource.fetch({ log, currentVersion }),
                ])

                const partial = githubAdvisories === null || activepiecesAdvisories === null
                const combined = [...(githubAdvisories ?? []), ...(activepiecesAdvisories ?? [])]
                const filtered = filterByVersion({ advisories: combined, currentVersion })

                const response: GetSecurityAdvisoriesResponse = {
                    currentVersion,
                    fetchedAt: dayjs().toISOString(),
                    advisories: filtered,
                    partial,
                }
                cache = { version: currentVersion, expiresAt: Date.now() + CACHE_TTL_MS, response }
                return response
            }
            finally {
                inflight = null
            }
        })()

        return inflight
    },
})

const readCache = (currentVersion: string): GetSecurityAdvisoriesResponse | null => {
    if (!cache || cache.version !== currentVersion || cache.expiresAt < Date.now()) return null
    return cache.response
}

const filterByVersion = ({ advisories, currentVersion }: { advisories: SecurityAdvisory[], currentVersion: string }): SecurityAdvisory[] => {
    return advisories.filter((advisory) => {
        const result = tryCatchSync(() => semver.satisfies(currentVersion, advisory.vulnerableVersionRange, { includePrerelease: true }))
        return result.error === null && result.data === true
    })
}

type CacheEntry = {
    version: string
    expiresAt: number
    response: GetSecurityAdvisoriesResponse
}
