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

let app: FastifyInstance
let stub: Server
let stubPort: number
let embedCalls = 0
let onNextEmbedCall: (() => Promise<void>) | null = null

function startEmbeddingStub(): Promise<void> {
    stub = createServer((req, res) => {
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
            const inputs: string[] = JSON.parse(body).input
            embedCalls++
            const hook = onNextEmbedCall
            onNextEmbedCall = null
            const respond = (): void => {
                const data = inputs.map((text, index) => ({
                    object: 'embedding',
                    index,
                    embedding: Array.from({ length: OPENAI_3_SMALL_DIMENSIONS }, (_, d) =>
                        ((text.charCodeAt(d % text.length) % 13) + 1) / 100),
                }))
                res.writeHead(200, { 'content-type': 'application/json' })
                res.end(JSON.stringify({ object: 'list', data, model: 'text-embedding-3-small', usage: { prompt_tokens: 1, total_tokens: 1 } }))
            }
            if (hook) {
                hook().then(respond).catch((error) => {
                    res.writeHead(500, { 'content-type': 'text/plain' })
                    res.end(String(error))
                })
                return
            }
            respond()
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

async function waitForReconcileToSettle(timeoutMs = 60_000): Promise<void> {
    const { systemJobsQueue } = await import('../../../../src/app/helper/system-jobs/system-job')
    const deadline = Date.now() + timeoutMs
    let idleStreak = 0
    while (Date.now() < deadline) {
        const failedJobs = await systemJobsQueue.getJobs(['failed'], 0, 5)
        if (failedJobs.length > 0) {
            throw new Error(`reindex job failed — ${JSON.stringify(failedJobs.map((j) => j.failedReason))}`)
        }
        const counts = await systemJobsQueue.getJobCounts('active', 'waiting', 'prioritized')
        const busy = (counts.active ?? 0) + (counts.waiting ?? 0) + (counts.prioritized ?? 0)
        idleStreak = busy === 0 ? idleStreak + 1 : 0
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
    await mockAndSaveBasicSetup()
}, 300_000)

afterAll(async () => {
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
        const stragglers = ['second', 'third', 'fourth', 'fifth', 'sixth']
        onNextEmbedCall = async (): Promise<void> => {
            await Promise.all(stragglers.map((name) => publish(name, '1.0.0', `Original ${name} description`)))
        }

        await publish('first', '1.0.0', 'Original first description')

        await waitForReconcileToSettle()

        for (const name of ['first', ...stragglers]) {
            const doc = await retrievalDocFor(name)
            expect(doc, `${name} missing from the index — its publish was dropped`).toBeDefined()
            expect(doc).toContain(`Original ${name === 'first' ? 'first' : name} description`)
        }
        expect(await unembeddedCount()).toBe(0)
        expect(embedCalls).toBeGreaterThan(1)
    }, 300_000)

    it('refreshes descriptions republished mid-reconcile — no stale text survives (runs after the burst test and republishes its pieces)', async () => {
        const stragglers = ['second', 'third', 'fourth']
        onNextEmbedCall = async (): Promise<void> => {
            await Promise.all(stragglers.map((name) => publish(name, '1.0.1', `Rewritten ${name} description`)))
        }

        await publish('first', '1.0.1', 'Rewritten first description')

        await waitForReconcileToSettle()

        for (const name of ['first', ...stragglers]) {
            const doc = await retrievalDocFor(name)
            expect(doc, `${name} still serves its pre-publish description`).not.toContain(`Original ${name} description`)
            expect(doc).toContain(`Rewritten ${name} description`)
        }
        expect(await unembeddedCount()).toBe(0)
    }, 300_000)
})
