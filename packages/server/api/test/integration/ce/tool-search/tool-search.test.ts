import { ActionBase, TriggerBase } from '@activepieces/pieces-framework'
import { PackageType, PieceType, TriggerStrategy, TriggerTestStrategy } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { databaseConnection, resetDatabaseConnection } from '../../../../src/app/database/database-connection'
import { system } from '../../../../src/app/helper/system/system'
import { l2normalize, ToolSearchEmbedder } from '../../../../src/app/tool-search/embedder'
import { toolSearchReindexService } from '../../../../src/app/tool-search/tool-search-reindex.service'
import { toolSearchService } from '../../../../src/app/tool-search/tool-search.service'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'

// Boots only the database (migrations run automatically on a POSTGRES DataSource via
// migrationsRun:true) — deliberately NOT the full server, whose app-event-routing module statically
// imports individual pieces that vite can't resolve in this test context. The engine only needs the
// schema + seeded piece_metadata rows; no fastify/HTTP layer is involved.
const log: FastifyBaseLogger = system.globalLogger()

// A deterministic bag-of-words embedder over a fixed vocabulary, L2-normalized with the real
// production normalizer. No key, no network — same embedder is injected into both reindex and
// query so the index↔query model_version + vector space stay consistent.
const VOCAB = ['slack', 'message', 'channel', 'calendar', 'event', 'email', 'gmail', 'send', 'create', 'new']

function bagOfWords(text: string): number[] {
    const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    return l2normalize(VOCAB.map((word) => tokens.filter((token) => token === word).length))
}

const fakeEmbedder: ToolSearchEmbedder = {
    modelVersion: `fake:bow:${VOCAB.length}`,
    dimensions: VOCAB.length,
    tau: 0,
    embed: (texts) => Promise.resolve(texts.map(bagOfWords)),
}

function action(over: Pick<ActionBase, 'name' | 'displayName' | 'description'> & { requireAuth?: boolean }): ActionBase {
    return { name: over.name, displayName: over.displayName, description: over.description, props: {}, requireAuth: over.requireAuth ?? true }
}

function trigger(over: Pick<TriggerBase, 'name' | 'displayName' | 'description'>): TriggerBase {
    return {
        name: over.name,
        displayName: over.displayName,
        description: over.description,
        props: {},
        requireAuth: true,
        type: TriggerStrategy.WEBHOOK,
        sampleData: {},
        testStrategy: TriggerTestStrategy.SIMULATION,
    }
}

async function seedCatalog(): Promise<void> {
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-slack',
        displayName: 'Slack',
        version: '1.0.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        actions: { send_channel_message: action({ name: 'send_channel_message', displayName: 'Send Channel Message', description: 'Send a message to a Slack channel' }) },
        triggers: { new_message: trigger({ name: 'new_message', displayName: 'New Message', description: 'Triggers when a new message is posted to a Slack channel' }) },
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-google-calendar',
        displayName: 'Google Calendar',
        version: '1.0.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        actions: { create_event: action({ name: 'create_event', displayName: 'Create Event', description: 'Create a new event in a Google Calendar' }) },
        triggers: {},
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-gmail',
        displayName: 'Gmail',
        version: '1.0.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        actions: { send_email: action({ name: 'send_email', displayName: 'Send Email', description: 'Send an email via Gmail' }) },
        triggers: {},
    }))
}

function indexRowCount(): Promise<number> {
    return databaseConnection().getRepository('tool_search_index').count()
}

async function nullEmbeddingCount(): Promise<number> {
    const [{ count }] = await databaseConnection().query(
        'SELECT COUNT(*)::int AS count FROM "tool_search_index" WHERE "embedding" IS NULL',
    )
    return count
}

type IndexRowProbe = { pieceVersion: string, embeddingInputHash: string, embedding: string | null, modelVersion: string }

async function getIndexRow(pieceName: string, objectName: string): Promise<IndexRowProbe | undefined> {
    const rows = await databaseConnection().query(
        `SELECT "pieceVersion", "embeddingInputHash", "embedding"::text AS embedding, "modelVersion"
         FROM "tool_search_index" WHERE "pieceName" = $1 AND "objectName" = $2`,
        [pieceName, objectName],
    )
    return rows[0]
}

beforeAll(async () => {
    resetDatabaseConnection()
    await databaseConnection().initialize()
}, 300_000)

afterAll(async () => {
    if (databaseConnection().isInitialized) {
        await databaseConnection().destroy()
    }
})

beforeEach(async () => {
    await databaseConnection().getRepository('tool_search_index').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
})

describe('Tool Search Engine (Phase 1)', () => {
    it('reindex populates one row per action and per trigger from the latest catalog', async () => {
        await seedCatalog()

        const result = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        expect(result.status).toBe('done')
        // 3 actions (slack, calendar, gmail) + 1 trigger (slack/new_message)
        expect(result.objectsIndexed).toBe(4)
        expect(await indexRowCount()).toBe(4)
    })

    it('searchActions ranks the semantically closest action first and returns the tiered envelope', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results, mode } = await toolSearchService(log).searchActions('send a slack message', { embedder: fakeEmbedder, limit: 3 })

        expect(mode).toBe('semantic')
        expect(results[0]).toMatchObject({
            pieceName: '@activepieces/piece-slack',
            actionName: 'send_channel_message',
            displayName: 'Send Channel Message',
            oneLineDescription: 'Send a message to a Slack channel',
            requiresConnection: true,
        })
        expect(results[0].cosine).toBeGreaterThan(results[1].cosine)
    })

    it('searchActions returns only actions — triggers never cross-contaminate', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results } = await toolSearchService(log).searchActions('new message posted to a channel', { embedder: fakeEmbedder, limit: 10 })

        expect(results.length).toBe(3)
        expect(results.every((r) => r.actionName !== 'new_message')).toBe(true)
    })

    it('reindex is idempotent — a second run upserts in place, no duplicate rows', async () => {
        await seedCatalog()

        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        const firstCount = await indexRowCount()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        const secondCount = await indexRowCount()

        expect(firstCount).toBe(4)
        expect(secondCount).toBe(4)
    })

    it('with no embedder and no resolvable key, reindex is a no-op (keyword floor would serve)', async () => {
        await seedCatalog()

        const result = await toolSearchReindexService(log).reindex({})

        expect(result.status).toBe('no-embedder')
        expect(result.objectsIndexed).toBe(0)
        expect(await indexRowCount()).toBe(0)
    })
})

describe('Tool Search Engine (Phase 2 — τ no-match gate)', () => {
    // The index is built once at the fake model_version; the gate is exercised by querying with the
    // SAME embedder (so model_version still matches the rows) at a τ above vs below the achievable
    // top-1 cosine. "send a slack message" lands its best match at cosine ≈ 0.87 on this vocabulary.
    const withTau = (tau: number): ToolSearchEmbedder => ({ ...fakeEmbedder, tau })

    it('abstains with an empty semantic result when the best cosine is below τ', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const response = await toolSearchService(log).searchActions('send a slack message', { embedder: withTau(0.99), limit: 5 })

        expect(response).toEqual({ results: [], mode: 'semantic' })
    })

    it('returns the ranked row when the best cosine clears τ', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results, mode } = await toolSearchService(log).searchActions('send a slack message', { embedder: withTau(0.1), limit: 5 })

        expect(mode).toBe('semantic')
        expect(results[0]).toMatchObject({ pieceName: '@activepieces/piece-slack', actionName: 'send_channel_message' })
        expect(results[0].cosine).toBeGreaterThanOrEqual(0.1)
    })
})

describe('Tool Search Engine (Phase 3 — incremental catalog sync)', () => {
    it('a pure version bump (no text change) re-embeds nothing — the hash is unchanged', async () => {
        await seedCatalog()
        const first = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        expect(first.objectsEmbedded).toBe(4)
        const before = await getIndexRow('@activepieces/piece-slack', 'send_channel_message')

        // New version row, identical actions/triggers text → same retrieval doc → same hash.
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@activepieces/piece-slack',
            displayName: 'Slack',
            version: '1.0.1',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            actions: { send_channel_message: action({ name: 'send_channel_message', displayName: 'Send Channel Message', description: 'Send a message to a Slack channel' }) },
            triggers: { new_message: trigger({ name: 'new_message', displayName: 'New Message', description: 'Triggers when a new message is posted to a Slack channel' }) },
        }))

        const second = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        expect(second.objectsIndexed).toBe(4)
        expect(second.objectsEmbedded).toBe(0)
        expect(await indexRowCount()).toBe(4)
        const after = await getIndexRow('@activepieces/piece-slack', 'send_channel_message')
        expect(after?.pieceVersion).toBe('1.0.1')
        expect(after?.embedding).toBe(before?.embedding)
        expect(after?.embedding).not.toBeNull()
    })

    it('a deleted piece has its index rows removed on the next reindex', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        expect(await indexRowCount()).toBe(4)

        await databaseConnection().getRepository('piece_metadata').delete({ name: '@activepieces/piece-gmail' })
        const result = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        expect(result.objectsDeleted).toBe(1)
        expect(result.objectsEmbedded).toBe(0)
        expect(await indexRowCount()).toBe(3)
        expect(await getIndexRow('@activepieces/piece-gmail', 'send_email')).toBeUndefined()
    })

    it('a model_version swap builds new-version rows while the old rows survive (serving reads until cutover)', async () => {
        const fakeEmbedderV2: ToolSearchEmbedder = { ...fakeEmbedder, modelVersion: `${fakeEmbedder.modelVersion}:v2` }
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const result = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedderV2 })

        // The new model's rows are built and embedded; the old ones are neither re-embedded nor deleted.
        expect(result.objectsEmbedded).toBe(4)
        expect(result.objectsDeleted).toBe(0)
        expect(await indexRowCount()).toBe(8)

        const oldRow = await getIndexRow('@activepieces/piece-slack', 'send_channel_message')
        expect(oldRow?.embedding).not.toBeNull()

        const [{ count: newRows }] = await databaseConnection().query(
            'SELECT COUNT(*)::int AS count FROM "tool_search_index" WHERE "modelVersion" = $1 AND "embedding" IS NOT NULL',
            [fakeEmbedderV2.modelVersion],
        )
        expect(newRows).toBe(4)
    })

    it('a platform-scoped reindex touches only that platform — shared catalog rows are never re-derived or deleted', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        expect(await indexRowCount()).toBe(4)

        // A custom piece is installed for one tenant.
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@acme/piece-internal',
            displayName: 'Acme Internal',
            version: '1.0.0',
            platformId: 'platform-a',
            pieceType: PieceType.CUSTOM,
            packageType: PackageType.REGISTRY,
            actions: { send_alert: action({ name: 'send_alert', displayName: 'Send Alert', description: 'Send an internal alert message' }) },
            triggers: {},
        }))

        const result = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder, scope: { type: 'platform', platformId: 'platform-a' } })

        // Desired set is scoped to platform-a's single object; only it is embedded; the 4 shared rows
        // are neither touched nor deleted (a NOT-IN-desired delete that ignored scope would wipe them).
        expect(result.objectsIndexed).toBe(1)
        expect(result.objectsEmbedded).toBe(1)
        expect(result.objectsDeleted).toBe(0)
        expect(await indexRowCount()).toBe(5)

        const [{ count: sharedRows }] = await databaseConnection().query(
            'SELECT COUNT(*)::int AS count FROM "tool_search_index" WHERE "platformId" IS NULL',
        )
        expect(sharedRows).toBe(4)

        const custom = await getIndexRow('@acme/piece-internal', 'send_alert')
        expect(custom?.embedding).not.toBeNull()
    })

    it('a failed embed batch leaves those rows NULL (reindex still completes) and they are retried next run', async () => {
        let calls = 0
        const flakyEmbedder: ToolSearchEmbedder = {
            ...fakeEmbedder,
            embed: (texts) => {
                calls++
                return calls === 1 ? Promise.reject(new Error('429 rate limited')) : Promise.resolve(texts.map(bagOfWords))
            },
        }
        await seedCatalog()

        const first = await toolSearchReindexService(log).reindex({ embedder: flakyEmbedder })

        // The diff still landed the rows; they just have no embedding yet.
        expect(first.status).toBe('done')
        expect(first.objectsEmbedded).toBe(0)
        expect(await indexRowCount()).toBe(4)
        expect(await nullEmbeddingCount()).toBe(4)

        const second = await toolSearchReindexService(log).reindex({ embedder: flakyEmbedder })

        expect(second.objectsEmbedded).toBe(4)
        expect(await nullEmbeddingCount()).toBe(0)
    })

    it('adding a new piece embeds only the new piece’s objects', async () => {
        await seedCatalog()
        const first = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        expect(first.objectsEmbedded).toBe(4)

        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@activepieces/piece-trello',
            displayName: 'Trello',
            version: '1.0.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            actions: { create_card: action({ name: 'create_card', displayName: 'Create Card', description: 'Create a new card on a Trello board' }) },
            triggers: {},
        }))

        const second = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        expect(second.objectsIndexed).toBe(5)
        expect(second.objectsEmbedded).toBe(1)
        expect(second.objectsDeleted).toBe(0)
        expect(await indexRowCount()).toBe(5)
    })

    it('a changed description re-embeds only that object', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        const before = await getIndexRow('@activepieces/piece-gmail', 'send_email')

        // New version of gmail with different action text → hash changes for that one object only.
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@activepieces/piece-gmail',
            displayName: 'Gmail',
            version: '1.0.1',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            actions: { send_email: action({ name: 'send_email', displayName: 'Send Email', description: 'Create and send a new email message via Gmail' }) },
            triggers: {},
        }))

        const result = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        expect(result.objectsEmbedded).toBe(1)
        expect(result.objectsDeleted).toBe(0)
        const after = await getIndexRow('@activepieces/piece-gmail', 'send_email')
        expect(after?.embeddingInputHash).not.toBe(before?.embeddingInputHash)
        expect(after?.embedding).not.toBeNull()
    })

    it('a second identical reindex is a no-op — nothing re-embedded, nothing deleted', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const second = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        expect(second.objectsIndexed).toBe(4)
        expect(second.objectsEmbedded).toBe(0)
        expect(second.objectsDeleted).toBe(0)
        expect(await indexRowCount()).toBe(4)
    })
})
