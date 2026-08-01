import { createServer, Server } from 'node:http'
import { ActionBase, PieceAuth } from '@activepieces/pieces-framework'
import { PackageType, PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { SystemJobName } from '../../../../src/app/helper/system-jobs/common'
import { OPENAI_3_SMALL_DIMENSIONS } from '../../../../src/app/tool-search/embedder'
import { toolSearchReindexJob } from '../../../../src/app/tool-search/tool-search-reindex.job'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

// End-to-end reproduction of the production failure, through the REAL pipeline: a publish writes
// piece_metadata and fires toolSearchReindexJob.enqueue (what admin-platform.controller.ts does), BullMQ
// dedups on the stable jobId, the worker runs the registered handler, and the handler resolves a real
// OpenAI embedder over HTTP. Nothing is injected — unlike tool-search.test.ts, which calls reindex()
// directly and so cannot show that the *collapse* is what drops a publish.
//
// The embedder is real code pointed at a local stub via OPENAI_BASE_URL (honoured by @ai-sdk/openai), so
// resolveEmbedder → createOpenAiEmbedder → embed → pgvector all execute with no key and no network.
let app: FastifyInstance
let stub: Server
let stubPort: number
let embedCalls = 0

// Deliberate latency on the embed call. It widens the window in which the reconcile is running, which is
// what makes the race deterministic — a real embed round-trip is this slow or slower.
const EMBED_DELAY_MS = 600

function startEmbeddingStub(): Promise<void> {
    stub = createServer((req, res) => {
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
            const inputs: string[] = JSON.parse(body).input
            embedCalls++
            // Deterministic unit-ish vectors, distinct per input, in the OpenAI embeddings response shape.
            const data = inputs.map((text, index) => ({
                object: 'embedding',
                index,
                embedding: Array.from({ length: OPENAI_3_SMALL_DIMENSIONS }, (_, d) =>
                    ((text.charCodeAt(d % text.length) % 13) + 1) / 100),
            }))
            setTimeout(() => {
                res.writeHead(200, { 'content-type': 'application/json' })
                res.end(JSON.stringify({ object: 'list', data, model: 'text-embedding-3-small', usage: { prompt_tokens: 1, total_tokens: 1 } }))
            }, EMBED_DELAY_MS)
        })
    })
    return new Promise((resolve) => {
        stub.listen(0, '127.0.0.1', () => {
            stubPort = (stub.address() as { port: number }).port
            resolve()
        })
    })
}

const pieceAuth = PieceAuth.SecretText({ displayName: 'API Key', required: true })

function piece(name: string, version: string, description: string): ReturnType<typeof createMockPieceMetadata> {
    return createMockPieceMetadata({
        name: `@activepieces/piece-${name}`,
        displayName: name,
        version,
        auth: pieceAuth,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        actions: {
            run: {
                name: 'run',
                displayName: 'Run',
                description,
                props: {},
                requireAuth: true,
                audience: 'both',
            } as ActionBase,
        },
        triggers: {},
    })
}

/** Exactly what POST /v1/admin/pieces does: write the metadata, then fire the reindex hook. */
async function publish(name: string, version: string, description: string): Promise<void> {
    await db.save('piece_metadata', piece(name, version, description))
    await toolSearchReindexJob(app.log).enqueue({ type: 'all' })
}

async function retrievalDocFor(name: string): Promise<string | undefined> {
    const rows = await databaseConnection().query(
        'SELECT "retrievalDoc", "embedding" IS NULL AS "unembedded" FROM "tool_search_index" WHERE "pieceName" = $1',
        [`@activepieces/piece-${name}`],
    )
    return rows[0]?.retrievalDoc
}

async function unembeddedCount(): Promise<number> {
    const [{ count }] = await databaseConnection().query('SELECT COUNT(*)::int AS count FROM "tool_search_index" WHERE "embedding" IS NULL')
    return count
}

/** Wait until the reindex queue is idle — no job running and none waiting to run. */
async function waitForReconcileToSettle(timeoutMs = 60_000): Promise<void> {
    const { systemJobsQueue } = await import('../../../../src/app/helper/system-jobs/system-job')
    const deadline = Date.now() + timeoutMs
    let idleStreak = 0
    // `delayed` is deliberately excluded: the hourly safety-net scheduler always has one delayed job
    // queued for the next run, so counting it would mean the queue is never idle.
    while (Date.now() < deadline) {
        const counts = await systemJobsQueue.getJobCounts('active', 'waiting', 'prioritized')
        const busy = (counts.active ?? 0) + (counts.waiting ?? 0) + (counts.prioritized ?? 0)
        idleStreak = busy === 0 ? idleStreak + 1 : 0
        // Three consecutive idle polls — a trailing pass runs inside one job, but a re-enqueue would
        // briefly show waiting, so don't call it settled on the first idle read.
        if (idleStreak >= 3) {
            return
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
    }
    const counts = await systemJobsQueue.getJobCounts()
    const failed = await systemJobsQueue.getJobs(['failed'], 0, 5)
    throw new Error(`reindex queue never settled — counts=${JSON.stringify(counts)} failed=${JSON.stringify(failed.map((j) => j.failedReason))}`)
}

beforeAll(async () => {
    await startEmbeddingStub()
    process.env.AP_TOOL_SEARCH_ENABLED = 'true'
    process.env.AP_OPENAI_API_KEY = 'sk-local-stub'
    process.env.OPENAI_BASE_URL = `http://127.0.0.1:${stubPort}`
    app = await setupTestEnvironment()
    // The handler funds embedding via getOldestPlatform() and returns early when there is none, so a
    // platform has to exist for the job path to run at all. (With AP_OPENAI_API_KEY set, resolveEmbedder
    // short-circuits to the env key — the platform only supplies an id.)
    await mockAndSaveBasicSetup()
}, 300_000)

afterAll(async () => {
    // Booting with the flag on registers the hourly safety-net schedule; drop it so it can't fire a
    // reconcile inside another suite sharing this queue.
    const { systemJobsQueue } = await import('../../../../src/app/helper/system-jobs/system-job')
    for (const scheduler of await systemJobsQueue.getJobSchedulers()) {
        if (scheduler.name === SystemJobName.TOOL_SEARCH_REINDEX) {
            await systemJobsQueue.removeJobScheduler(scheduler.id ?? scheduler.key)
        }
    }
    delete process.env.AP_TOOL_SEARCH_ENABLED
    delete process.env.AP_OPENAI_API_KEY
    delete process.env.OPENAI_BASE_URL
    await new Promise((resolve) => stub.close(resolve))
    await teardownTestEnvironment()
})

describe('Tool Search — publish burst through the real enqueue → BullMQ → reindex path', () => {
    it('indexes every piece of a burst that lands while the reconcile is running', async () => {
        // 1. First publish. Its enqueue creates the job; the worker starts it within milliseconds and it
        //    reads its catalog snapshot, then blocks on the (slow) embed call.
        await publish('first', '1.0.0', 'Original first description')
        await new Promise((resolve) => setTimeout(resolve, 400))

        // 2. The rest of the batch commits while that job is mid-run — concurrently, as the publish script
        //    does (chunks of 30 via Promise.all). Every one of these enqueues collapses onto the active
        //    job and is a silent no-op. On main they are dropped outright.
        const stragglers = ['second', 'third', 'fourth', 'fifth', 'sixth']
        await Promise.all(stragglers.map((name) => publish(name, '1.0.0', `Original ${name} description`)))

        await waitForReconcileToSettle()

        // 3. Every piece in the burst must be in the index, embedded.
        for (const name of ['first', ...stragglers]) {
            const doc = await retrievalDocFor(name)
            expect(doc, `${name} missing from the index — its publish was dropped`).toBeDefined()
            expect(doc).toContain(`Original ${name === 'first' ? 'first' : name} description`)
        }
        expect(await unembeddedCount()).toBe(0)
        expect(embedCalls).toBeGreaterThan(1)
    }, 300_000)

    // Runs after the test above and re-publishes the pieces it created — keep them in this order.
    it('refreshes descriptions republished mid-reconcile — no stale text survives', async () => {
        // The reported symptom: a re-publish (new version, rewritten action text) landing inside a running
        // reconcile keeps serving its pre-publish description.
        await publish('first', '1.0.1', 'Rewritten first description')
        await new Promise((resolve) => setTimeout(resolve, 400))
        const stragglers = ['second', 'third', 'fourth']
        await Promise.all(stragglers.map((name) => publish(name, '1.0.1', `Rewritten ${name} description`)))

        await waitForReconcileToSettle()

        for (const name of ['first', ...stragglers]) {
            const doc = await retrievalDocFor(name)
            // Assert the OLD text is gone — "new text present" passes trivially on whichever piece won
            // the snapshot race and hides the ones that did not.
            expect(doc, `${name} still serves its pre-publish description`).not.toContain(`Original ${name} description`)
            expect(doc).toContain(`Rewritten ${name} description`)
        }
        expect(await unembeddedCount()).toBe(0)
    }, 300_000)
})
