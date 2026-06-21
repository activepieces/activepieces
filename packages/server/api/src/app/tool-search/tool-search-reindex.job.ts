import { apDayjs } from '@activepieces/server-utils'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock } from '../database/redis-connections'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { platformService } from '../platform/platform.service'
import { ReindexScope, toolSearchReindexService } from './tool-search-reindex.service'

// One global lock TTL; RedLock auto-extends it while the reconcile runs, so this only needs to be
// comfortably larger than a single embed round-trip — a full re-embed (model swap) keeps extending.
const REINDEX_LOCK_TIMEOUT_SECONDS = 300

/**
 * Stable BullMQ jobId per scope. The global reconcile always enqueues under one id so a burst of
 * catalog changes collapses to a single pending job (dedup); each platform gets its own id so a
 * tenant install isn't starved by — and doesn't cancel — the global job.
 */
export function reindexJobId(scope: ReindexScope): string {
    return scope.type === 'all'
        ? 'tool-search-reindex'
        : `tool-search-reindex:platform:${scope.platformId}`
}

/**
 * One global lock key for every scope. A global reconcile and a platform-scoped one overlap on that
 * tenant's rows, so they must never run concurrently across app servers — a single key serializes
 * all reconciles. Reindex is fast and infrequent, so the serialization cost is negligible.
 */
export function reindexLockKey(_scope: ReindexScope): string {
    return 'tool-search-reindex'
}

export const toolSearchReindexJob = (log: FastifyBaseLogger) => ({
    /** Register the worker handler. Called once at boot; the job only ever runs via {@link enqueue}. */
    register(): void {
        systemJobHandlers.registerJobHandler(SystemJobName.TOOL_SEARCH_REINDEX, async (data) => {
            await distributedLock(log).runExclusive({
                key: reindexLockKey(data.scope),
                timeoutInSeconds: REINDEX_LOCK_TIMEOUT_SECONDS,
                fn: async () => {
                    // Embedding is funded by the platform that holds the AI key (the oldest platform —
                    // the same one embed-security / chat use); scope only bounds which rows reconcile.
                    const platform = await platformService(log).getOldestPlatform()
                    if (isNil(platform)) {
                        log.info('[toolSearchReindexJob] No platform configured — skipping reindex.')
                        return
                    }
                    await toolSearchReindexService(log).reindex({ scope: data.scope, platformId: platform.id })
                },
            })
        })
    },

    /**
     * Enqueue an async reconcile off a catalog-change signal — never inline on the piece-sync / insert
     * path. Runs immediately (one-time job) and dedups on the per-scope jobId.
     */
    async enqueue(scope: ReindexScope): Promise<void> {
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.TOOL_SEARCH_REINDEX,
                data: { scope },
                jobId: reindexJobId(scope),
            },
            schedule: {
                type: 'one-time',
                date: apDayjs(),
            },
        })
    },
})
