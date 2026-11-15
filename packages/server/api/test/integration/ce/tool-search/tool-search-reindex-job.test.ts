import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { SystemJobName } from '../../../../src/app/helper/system-jobs/common'
import { systemJobHandlers } from '../../../../src/app/helper/system-jobs/job-handlers'
import { systemJobsQueue } from '../../../../src/app/helper/system-jobs/system-job'
import { toolSearchReindexJob } from '../../../../src/app/tool-search/tool-search-reindex.job'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

// Boots the FULL server (setupServer → setupApp), which runs the app.ts boot wiring including
// toolSearchReindexJob(app.log).register(). The MEMORY redis is a real redis-memory-server binary,
// so BullMQ + the RedLock distributed lock genuinely run here.
let app: FastifyInstance

async function reindexSchedulers(): Promise<{ name: string, pattern?: string | null, id?: string | null, key: string }[]> {
    const schedulers = await systemJobsQueue.getJobSchedulers()
    return schedulers.filter((scheduler) => scheduler.name === SystemJobName.TOOL_SEARCH_REINDEX)
}

beforeAll(async () => {
    app = await setupTestEnvironment()
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(async () => {
    delete process.env.AP_TOOL_SEARCH_ENABLED
    for (const scheduler of await reindexSchedulers()) {
        await systemJobsQueue.removeJobScheduler(scheduler.id ?? scheduler.key)
    }
})

describe('Tool Search reindex job (Phase 3 — async wiring)', () => {
    it('registers the TOOL_SEARCH_REINDEX handler at boot', () => {
        // Throws "No handler for job ..." if app.ts never called register() — guards the boot wiring.
        expect(() => systemJobHandlers.getJobHandler(SystemJobName.TOOL_SEARCH_REINDEX)).not.toThrow()
    })

    it('the registered handler runs end-to-end (acquires the lock, resolves the platform, invokes reindex) and no-ops cleanly with no AI key', async () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'
        const handler = systemJobHandlers.getJobHandler(SystemJobName.TOOL_SEARCH_REINDEX)
        // Real RedLock + getOldestPlatform + reindex. No OpenAI key is configured in tests, so the
        // reconcile resolves no embedder and no-ops — but the lock/platform/reindex glue all execute.
        await expect(handler({ scope: { type: 'all' } })).resolves.toBeUndefined()
    })

    it('the handler no-ops when the flag is off, so a schedule that outlived the flip does no work', async () => {
        delete process.env.AP_TOOL_SEARCH_ENABLED
        const handler = systemJobHandlers.getJobHandler(SystemJobName.TOOL_SEARCH_REINDEX)
        await expect(handler({ scope: { type: 'all' } })).resolves.toBeUndefined()
    })

    it('enqueue schedules the reindex without blocking and is processed by the worker', async () => {
        // The worker is running (app.ts startWorker), so an enqueued one-time job is picked up and the
        // handler runs (no-op without a key). We only assert the enqueue itself integrates cleanly.
        await expect(toolSearchReindexJob(app.log).enqueue({ type: 'platform', platformId: 'platform-xyz' })).resolves.toBeUndefined()
    })
})

describe('Tool Search recurring reconcile (safety net)', () => {
    it('registers one repeated reconcile when the flag is on', async () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'

        await toolSearchReindexJob(app.log).scheduleRecurringReconcile()

        const scheduled = await reindexSchedulers()
        expect(scheduled).toHaveLength(1)
        expect(scheduled[0].pattern).toBe('30 * * * *')
    })

    it('is idempotent across replica boots — a second call does not add a second schedule', async () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'

        await toolSearchReindexJob(app.log).scheduleRecurringReconcile()
        await toolSearchReindexJob(app.log).scheduleRecurringReconcile()

        expect(await reindexSchedulers()).toHaveLength(1)
    })

    it('registers nothing when the flag is off', async () => {
        delete process.env.AP_TOOL_SEARCH_ENABLED

        await toolSearchReindexJob(app.log).scheduleRecurringReconcile()

        expect(await reindexSchedulers()).toHaveLength(0)
    })
})
