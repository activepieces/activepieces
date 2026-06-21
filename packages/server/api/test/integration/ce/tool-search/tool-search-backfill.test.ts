import { apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { toolSearchReindexJob } from '../../../../src/app/tool-search/tool-search-reindex.job'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

// Boots the FULL server (setupServer → setupApp) on real redis-memory-server, so BullMQ + the RedLock
// distributed lock genuinely run — same harness as tool-search-reindex-job.test.ts. backfillIfEmpty is
// the cold-start path: it reads the live AP_TOOL_SEARCH_ENABLED flag and the real tool_search_index
// table, then decides whether to schedule one global reconcile. We spy on the job's own enqueue (which
// backfillIfEmpty calls via `this`) to assert the decision deterministically — no worker race, and the
// flag / empty-index reads are the real ones.
let app: FastifyInstance

async function seedIndexRow(): Promise<void> {
    await databaseConnection().query(
        `INSERT INTO "tool_search_index" (
            "id", "objectKind", "pieceName", "pieceVersion", "objectName", "displayName",
            "retrievalDoc", "requiresConnection", "modelVersion", "embeddingInputHash"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [apId(), 'action', 'seed-piece', '0.0.1', 'seed_action', 'Seed Action', 'seed doc', false, 'test-model', 'seed-hash'],
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

describe('Tool Search backfill (cold-start backfill-if-empty)', () => {
    it('does NOT enqueue when the flag is OFF, even with an empty index', async () => {
        delete process.env.AP_TOOL_SEARCH_ENABLED
        await clearIndex()

        const job = toolSearchReindexJob(app.log)
        const enqueueSpy = vi.spyOn(job, 'enqueue')

        await job.backfillIfEmpty()

        expect(enqueueSpy).not.toHaveBeenCalled()
    })

    it('does NOT enqueue when the flag is ON but the index already has rows (steady-state owns deltas)', async () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'
        await seedIndexRow()

        const job = toolSearchReindexJob(app.log)
        const enqueueSpy = vi.spyOn(job, 'enqueue')

        await job.backfillIfEmpty()

        expect(enqueueSpy).not.toHaveBeenCalled()
    })

    it('DOES enqueue a global {type:all} reconcile when the flag is ON and the index is empty', async () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'
        await clearIndex()

        const job = toolSearchReindexJob(app.log)
        const enqueueSpy = vi.spyOn(job, 'enqueue')

        await job.backfillIfEmpty()

        expect(enqueueSpy).toHaveBeenCalledTimes(1)
        expect(enqueueSpy).toHaveBeenCalledWith({ type: 'all' })
    })
})
