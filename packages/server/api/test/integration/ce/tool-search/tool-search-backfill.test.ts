import { apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { OPENAI_3_SMALL_MODEL_VERSION } from '../../../../src/app/tool-search/embedder'
import { toolSearchReindexJob } from '../../../../src/app/tool-search/tool-search-reindex.job'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

// Boots the FULL server (setupServer → setupApp) on real redis-memory-server, so BullMQ + the RedLock
// distributed lock genuinely run — same harness as tool-search-reindex-job.test.ts. backfillIfNeeded is
// the boot path: it reads the live AP_TOOL_SEARCH_ENABLED flag and the real tool_search_index table, then
// decides whether to schedule one global reconcile. We spy on the job's own enqueue (which backfillIfNeeded
// calls via `this`) to assert the decision deterministically — no worker race, and the flag / coverage
// reads are the real ones.
let app: FastifyInstance

async function seedRow({ embedding }: { embedding: string | null }): Promise<void> {
    await databaseConnection().query(
        `INSERT INTO "tool_search_index" (
            "id", "objectKind", "pieceName", "pieceVersion", "objectName", "displayName",
            "retrievalDoc", "requiresConnection", "modelVersion", "embeddingInputHash", "embedding"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::vector)`,
        [apId(), 'action', 'seed-piece', '0.0.1', 'seed_action', 'Seed Action', 'seed doc', false, OPENAI_3_SMALL_MODEL_VERSION, 'seed-hash', embedding],
    )
}

async function clearIndex(): Promise<void> {
    await databaseConnection().query('DELETE FROM "tool_search_index"')
}

beforeAll(async () => {
    app = await setupTestEnvironment()
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(async () => {
    delete process.env.AP_TOOL_SEARCH_ENABLED
    await clearIndex()
    vi.restoreAllMocks()
})

describe('Tool Search backfill (boot reconcile-if-needed)', () => {
    it('does NOT enqueue when the flag is OFF, even with an empty index', async () => {
        delete process.env.AP_TOOL_SEARCH_ENABLED
        await clearIndex()

        const job = toolSearchReindexJob(app.log)
        const enqueueSpy = vi.spyOn(job, 'enqueue')

        await job.backfillIfNeeded()

        expect(enqueueSpy).not.toHaveBeenCalled()
    })

    it('does NOT enqueue when the flag is ON and every row is already embedded (fully built)', async () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'
        await seedRow({ embedding: '[0.1,0.2,0.3]' })

        const job = toolSearchReindexJob(app.log)
        const enqueueSpy = vi.spyOn(job, 'enqueue')

        await job.backfillIfNeeded()

        expect(enqueueSpy).not.toHaveBeenCalled()
    })

    it('DOES enqueue a global {type:all} reconcile when the flag is ON and the index is empty', async () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'
        await clearIndex()

        const job = toolSearchReindexJob(app.log)
        const enqueueSpy = vi.spyOn(job, 'enqueue')

        await job.backfillIfNeeded()

        expect(enqueueSpy).toHaveBeenCalledTimes(1)
        expect(enqueueSpy).toHaveBeenCalledWith({ type: 'all' })
    })

    it('DOES enqueue when the flag is ON and the index is partially embedded (a prior build left rows NULL)', async () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'
        await seedRow({ embedding: null })

        const job = toolSearchReindexJob(app.log)
        const enqueueSpy = vi.spyOn(job, 'enqueue')

        await job.backfillIfNeeded()

        expect(enqueueSpy).toHaveBeenCalledTimes(1)
        expect(enqueueSpy).toHaveBeenCalledWith({ type: 'all' })
    })
})
