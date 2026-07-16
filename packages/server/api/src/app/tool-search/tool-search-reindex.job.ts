import { apDayjs } from '@activepieces/server-utils'
import { ApEdition, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock } from '../database/redis-connections'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { platformService } from '../platform/platform.service'
import { isToolSearchEnabled } from './tool-search-flag'
import { ReindexScope, toolSearchIndexCoverage, toolSearchReindexService, toolSearchTableExists } from './tool-search-reindex.service'

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

/**
 * Whether to skip a reconcile because there is no legitimate embedding funder.
 *
 * On CLOUD the shared catalog must be funded explicitly by `AP_OPENAI_API_KEY` — we never fall back
 * to the oldest platform's key (that platform is Activepieces' own host tenant, not a valid funder
 * for every tenant's catalog). So on cloud without the env key we skip the reconcile and let the
 * keyword floor serve, rather than silently billing the host. Self-hosted editions keep the
 * oldest-platform fallback.
 */
export function shouldSkipReindexOnCloud(): boolean {
    if (system.getEdition() !== ApEdition.CLOUD) {
        return false
    }
    const envApiKey = system.get(AppSystemProp.OPENAI_API_KEY)
    return isNil(envApiKey) || envApiKey === ''
}

export const toolSearchReindexJob = (log: FastifyBaseLogger) => ({
    /** Register the worker handler. Called once at boot; the job only ever runs via {@link enqueue}. */
    register(): void {
        systemJobHandlers.registerJobHandler(SystemJobName.TOOL_SEARCH_REINDEX, async (data) => {
            await distributedLock(log).runExclusive({
                key: reindexLockKey(data.scope),
                timeoutInSeconds: REINDEX_LOCK_TIMEOUT_SECONDS,
                fn: async () => {
                    if (shouldSkipReindexOnCloud()) {
                        log.warn('[toolSearchReindexJob] Cloud edition without AP_OPENAI_API_KEY — a reconcile was requested but cannot run; set AP_OPENAI_API_KEY to fund embedding (keyword floor serves meanwhile).')
                        return
                    }
                    // Embedding is funded by AP_OPENAI_API_KEY when set; otherwise (self-host only) by
                    // the platform that holds the AI key (the oldest platform — same one embed-security
                    // / chat use). Scope only bounds which rows reconcile, never whose key pays.
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

    /**
     * Boot reconcile: (re)build the index when it is empty OR only partially embedded. The steady-state
     * hook (piece-sync) only fires on a catalog delta, so without this a deployment whose piece_metadata
     * is already populated would leave the index unbuilt after AP_TOOL_SEARCH_ENABLED is flipped on — and
     * a build that failed midway (embedder rate-limited, leaving rows with NULL embeddings) would never
     * retry until the next piece add/delete. Covers fresh-deploy, already-populated-deploy, and
     * partial-build recovery.
     *
     * No-op once the index is fully embedded: the coverage read is a single cheap aggregate, so re-running
     * at every boot has no side effects. Called fire-and-forget at boot (after register()); it must never
     * throw fatally, so any DB error surfaces through rejectedPromiseHandler, not boot.
     */
    async backfillIfNeeded(): Promise<void> {
        if (!isToolSearchEnabled()) {
            return
        }
        if (shouldSkipReindexOnCloud()) {
            log.warn('[toolSearchReindexJob#backfillIfNeeded] Cloud edition without AP_OPENAI_API_KEY — tool-search is enabled but cannot build its index; set AP_OPENAI_API_KEY to fund embedding (keyword floor serves meanwhile).')
            return
        }
        if (!await toolSearchTableExists()) {
            log.info('[toolSearchReindexJob#backfillIfNeeded] tool_search_index is absent (pgvector not installed) — skipping backfill; keyword floor serves.')
            return
        }
        const coverage = await toolSearchIndexCoverage()
        if (coverage.total > 0 && coverage.pending === 0) {
            log.info(coverage, '[toolSearchReindexJob#backfillIfNeeded] Tool-search index fully built — nothing to reconcile.')
            return
        }
        if (coverage.total === 0) {
            log.info(coverage, '[toolSearchReindexJob#backfillIfNeeded] Tool-search enabled with an empty index — scheduling the initial global reconcile (cold-start backfill).')
        }
        else {
            log.warn(coverage, '[toolSearchReindexJob#backfillIfNeeded] Tool-search index partially embedded (a prior build left rows unembedded) — scheduling a global reconcile to finish it.')
        }
        await this.enqueue({ type: 'all' })
    },
})
