import { ActionBase, TriggerBase } from '@activepieces/pieces-framework'
import { apId, PackageType, PieceCategory, PieceType, TriggerStrategy, TriggerTestStrategy } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { databaseConnection, resetDatabaseConnection } from '../../../../src/app/database/database-connection'
import { encryptUtils } from '../../../../src/app/helper/encryption'
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

function action(over: Pick<ActionBase, 'name' | 'displayName' | 'description'> & { requireAuth?: boolean, audience?: ActionBase['audience'] }): ActionBase {
    return { name: over.name, displayName: over.displayName, description: over.description, props: {}, requireAuth: over.requireAuth ?? true, audience: over.audience }
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

    it('defaults requiresConnection to true when requireAuth is absent (legacy piece_metadata)', async () => {
        // Simulates a piece_metadata row written before requireAuth became a required boolean: the stored
        // JSON has no requireAuth key, so it reads back as undefined. Before the `?? true` coalesce this
        // bound NULL into the NOT NULL requiresConnection column, aborting the whole upsert (index unbuilt).
        const legacyAction = { name: 'legacy_action', displayName: 'Legacy Action', description: 'Send a message to a Slack channel', props: {} } as unknown as ActionBase
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@activepieces/piece-legacy',
            displayName: 'Legacy',
            version: '1.0.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            actions: { legacy_action: legacyAction },
            triggers: {},
        }))

        const result = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        expect(result.status).toBe('done')
        expect(result.objectsIndexed).toBe(1)
        const [row] = await databaseConnection().query(
            'SELECT "requiresConnection" FROM "tool_search_index" WHERE "pieceName" = $1 AND "objectName" = $2',
            ['@activepieces/piece-legacy', 'legacy_action'],
        )
        expect(row.requiresConnection).toBe(true)
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

describe('Tool Search Engine (bulk upsert — crosses the chunk boundary)', () => {
    // Every other test seeds ≤5 objects, so the chunked multi-row upsert path (≤50 rows per INSERT)
    // is never crossed. Seed a single piece exploded into far more than one chunk's worth of objects
    // so a placeholder-indexing or per-row array-cast bug in the batched INSERT surfaces, and confirm
    // a re-run is still a true no-op (the per-row ON CONFLICT guard must survive batching).
    const OBJECT_COUNT = 120

    async function seedBulkCatalog(): Promise<void> {
        const actions: Record<string, ActionBase> = {}
        for (let i = 0; i < OBJECT_COUNT; i++) {
            actions[`bulk_action_${i}`] = action({
                name: `bulk_action_${i}`,
                displayName: `Bulk Action ${i}`,
                description: `Send bulk message number ${i}`,
            })
        }
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@activepieces/piece-bulk',
            displayName: 'Bulk',
            version: '1.0.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            // A non-empty categories array exercises the per-row `::varchar[]` cast inside the
            // multi-row VALUES list, not just the scalar columns.
            categories: [PieceCategory.COMMUNICATION],
            actions,
            triggers: {},
        }))
    }

    it('indexes a catalog spanning multiple upsert chunks and a re-run stays a no-op', async () => {
        await seedBulkCatalog()

        const first = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        expect(first.status).toBe('done')
        expect(first.objectsIndexed).toBe(OBJECT_COUNT)
        expect(first.objectsEmbedded).toBe(OBJECT_COUNT)
        expect(await indexRowCount()).toBe(OBJECT_COUNT)

        const second = await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })
        expect(second.objectsIndexed).toBe(OBJECT_COUNT)
        expect(second.objectsEmbedded).toBe(0)
        expect(second.objectsDeleted).toBe(0)
        expect(await indexRowCount()).toBe(OBJECT_COUNT)
    })
})

// One piece whose four actions span every audience value (incl. an unset/NULL one) so the
// COALESCE-based exclusion can be exercised without dropping NULL-audience rows.
async function seedAudiences(): Promise<void> {
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-notify',
        displayName: 'Notify',
        version: '1.0.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        actions: {
            send_human: action({ name: 'send_human', displayName: 'Send (human)', description: 'Send a message to a channel', audience: 'human' }),
            send_ai: action({ name: 'send_ai', displayName: 'Send (ai)', description: 'Send a message to a channel', audience: 'ai' }),
            send_both: action({ name: 'send_both', displayName: 'Send (both)', description: 'Send a message to a channel', audience: 'both' }),
            send_unset: action({ name: 'send_unset', displayName: 'Send (unset)', description: 'Send a message to a channel' }),
        },
        triggers: {},
    }))
}

function actionNames(results: { actionName: string }[]): string[] {
    return results.map((r) => r.actionName).sort()
}

describe('Tool Search Engine (Phase 4 — multi-tenancy & filtering)', () => {
    it('audiences [ai, both] excludes human rows without dropping NULL-audience rows', async () => {
        await seedAudiences()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 10,
            audiences: ['ai', 'both'],
        })

        // human excluded; ai + both kept; NULL-audience (COALESCE → 'both') kept.
        expect(actionNames(results)).toEqual(['send_ai', 'send_both', 'send_unset'])
    })

    it('omitting audiences returns every audience (no filter)', async () => {
        await seedAudiences()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 10,
        })

        expect(actionNames(results)).toEqual(['send_ai', 'send_both', 'send_human', 'send_unset'])
    })

    it('a tenant query returns base-catalog + its own custom pieces, never another tenant’s', async () => {
        await seedCatalog()
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@acme/piece-internal',
            displayName: 'Acme Internal',
            version: '1.0.0',
            platformId: 'platform-a',
            pieceType: PieceType.CUSTOM,
            packageType: PackageType.REGISTRY,
            actions: { send_alert: action({ name: 'send_alert', displayName: 'Send Alert', description: 'Send an internal alert message to a channel' }) },
            triggers: {},
        }))
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@globex/piece-secret',
            displayName: 'Globex Secret',
            version: '1.0.0',
            platformId: 'platform-b',
            pieceType: PieceType.CUSTOM,
            packageType: PackageType.REGISTRY,
            actions: { send_secret: action({ name: 'send_secret', displayName: 'Send Secret', description: 'Send a secret message to a channel' }) },
            triggers: {},
        }))
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 20,
            platformId: 'platform-a',
        })

        const pieces = results.map((r) => r.pieceName)
        expect(pieces).toContain('@activepieces/piece-slack') // shared base catalog
        expect(pieces).toContain('@acme/piece-internal') // own custom piece
        expect(pieces).not.toContain('@globex/piece-secret') // another tenant's — never visible
    })

    it('disabled pieces do not surface — only enabledPieceNames are returned', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        // Gmail is disabled for this tenant (absent from the enabled set); Slack + Calendar are on.
        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 10,
            enabledPieceNames: new Set(['@activepieces/piece-slack', '@activepieces/piece-google-calendar']),
        })

        const pieces = results.map((r) => r.pieceName)
        expect(pieces).toContain('@activepieces/piece-slack')
        expect(pieces).not.toContain('@activepieces/piece-gmail')
    })

    it('applies tenant + audience + enabled-piece + connected filters together', async () => {
        await seedAudiences() // @activepieces/piece-notify: send_human/ai/both/unset
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@activepieces/piece-other',
            displayName: 'Other',
            version: '1.0.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            actions: { send_other: action({ name: 'send_other', displayName: 'Send Other', description: 'Send a message to a channel', audience: 'ai' }) },
            triggers: {},
        }))
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 20,
            audiences: ['ai', 'both'], // excludes send_human
            enabledPieceNames: new Set(['@activepieces/piece-notify']), // excludes @piece-other
            connectedPieceNames: new Set(['@activepieces/piece-notify']),
        })

        // Only Notify's non-human actions survive both filters, each flagged connected.
        expect(actionNames(results)).toEqual(['send_ai', 'send_both', 'send_unset'])
        expect(results.every((r) => r.pieceName === '@activepieces/piece-notify' && r.connected === true)).toBe(true)
    })

    it('each row carries an accurate connected flag for the calling tenant', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        // The tenant has a Slack connection but no Gmail/Calendar connection.
        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 10,
            connectedPieceNames: new Set(['@activepieces/piece-slack']),
        })

        const slack = results.find((r) => r.pieceName === '@activepieces/piece-slack')
        const gmail = results.find((r) => r.pieceName === '@activepieces/piece-gmail')
        expect(slack?.connected).toBe(true)
        expect(gmail?.connected).toBe(false)
    })

    it('resolves the connected flag from real app_connection rows (no injected set)', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        // A real ACTIVE Slack connection for this project; ownerId NULL to sidestep the user FK.
        const projectId = apId()
        await db.save('app_connection', {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            displayName: 'My Slack',
            externalId: apId(),
            type: 'SECRET_TEXT',
            status: 'ACTIVE',
            platformId: 'platform-conn',
            pieceName: '@activepieces/piece-slack',
            ownerId: null,
            projectIds: [projectId],
            scope: 'PROJECT',
            // list() decrypts every row, so the stored value must be a real encrypted object.
            value: await encryptUtils.encryptObject({ type: 'SECRET_TEXT', secret_text: 'x' }),
            metadata: {},
            pieceVersion: '1.0.0',
            preSelectForNewProjects: false,
        })

        // No injected connectedPieceNames — the service resolves from app_connection itself.
        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 10,
            platformId: 'platform-conn',
            projectId,
        })

        const slack = results.find((r) => r.pieceName === '@activepieces/piece-slack')
        const gmail = results.find((r) => r.pieceName === '@activepieces/piece-gmail')
        expect(slack?.connected).toBe(true)
        expect(gmail?.connected).toBe(false)
    })

    it('the connected flag is omitted when no tenant connection context is available', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 10,
        })

        expect(results.every((r) => r.connected === undefined)).toBe(true)
    })

    it('pieceName scope restricts results to that piece’s actions', async () => {
        await seedCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        // A broad query that otherwise matches several pieces, scoped to Slack only.
        const { results } = await toolSearchService(log).searchActions('send a message', {
            embedder: fakeEmbedder,
            limit: 10,
            pieceName: '@activepieces/piece-slack',
        })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every((r) => r.pieceName === '@activepieces/piece-slack')).toBe(true)
    })
})

describe('Tool Search Engine (Phase 5 — keyword floor / degradation)', () => {
    it('degrades to the keyword floor (the pre-existing Fuse catalog search) when no embedder/key is available', async () => {
        await seedCatalog()
        // No reindex, no embedder, no platformId → embedder resolves to null → keyword floor.

        const { results, mode, degradeReason } = await toolSearchService(log).searchActions('send message', { limit: 5 })

        expect(mode).toBe('keyword')
        // No model is configured, so the reason must be no-embedder (not a failed call).
        expect(degradeReason).toBe('no-embedder')
        const slack = results.find((r) => r.pieceName === '@activepieces/piece-slack')
        expect(slack).toMatchObject({
            actionName: 'send_channel_message',
            displayName: 'Send Channel Message',
            oneLineDescription: 'Send a message to a Slack channel',
            requiresConnection: true,
        })
        // Keyword rows carry no cosine, and triggers never cross into action results.
        expect(slack?.cosine).toBeUndefined()
        expect(results.every((r) => r.actionName !== 'new_message')).toBe(true)
    })

    it('degrades to the keyword floor when the embed call itself fails', async () => {
        await seedCatalog()
        const throwingEmbedder: ToolSearchEmbedder = {
            ...fakeEmbedder,
            embed: () => Promise.reject(new Error('openai unreachable')),
        }

        const { results, mode, degradeReason } = await toolSearchService(log).searchActions('send message', { embedder: throwingEmbedder, limit: 5 })

        expect(mode).toBe('keyword')
        // A model WAS configured; its embed call threw — the reason must reflect the failure, not config.
        expect(degradeReason).toBe('embed-failed')
        expect(results.some((r) => r.pieceName === '@activepieces/piece-slack')).toBe(true)
    })

    it('honors the pieceName scope in the keyword floor — a scoped query returns only that piece’s rows', async () => {
        await seedCatalog()
        // No embedder → keyword floor. Unscoped, "send" matches more than one piece (Slack + Gmail),
        // so the scope below is doing real work — it must not silently vanish on degrade.
        const unscoped = await toolSearchService(log).searchActions('send', { limit: 10 })
        expect(unscoped.mode).toBe('keyword')
        expect(new Set(unscoped.results.map((r) => r.pieceName)).size).toBeGreaterThan(1)

        const { results, mode } = await toolSearchService(log).searchActions('send', {
            limit: 10,
            pieceName: '@activepieces/piece-slack',
        })

        expect(mode).toBe('keyword')
        expect(results.length).toBeGreaterThan(0)
        expect(results.every((r) => r.pieceName === '@activepieces/piece-slack')).toBe(true)
    })
})

// Two pieces each carrying both an action and a trigger, so the trigger-side query path can be
// exercised for ranking, action/trigger isolation, and pieceName scope on the same vocabulary.
async function seedTriggerCatalog(): Promise<void> {
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
        triggers: { new_event: trigger({ name: 'new_event', displayName: 'New Event', description: 'Triggers when a new event is created in a Google Calendar' }) },
    }))
}

function triggerNames(results: { triggerName: string }[]): string[] {
    return results.map((r) => r.triggerName).sort()
}

describe('Tool Search Engine (Phase 6 — ap_search_triggers)', () => {
    it('searchTriggers ranks the semantically closest trigger first and returns the tiered envelope', async () => {
        await seedTriggerCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results, mode } = await toolSearchService(log).searchTriggers('a new message posted to a channel', { embedder: fakeEmbedder, limit: 5 })

        expect(mode).toBe('semantic')
        expect(results[0]).toMatchObject({
            pieceName: '@activepieces/piece-slack',
            triggerName: 'new_message',
            displayName: 'New Message',
            oneLineDescription: 'Triggers when a new message is posted to a Slack channel',
            requiresConnection: true,
        })
        expect(results[0].cosine).toBeGreaterThan(results[1].cosine)
    })

    it('searchTriggers returns only triggers — actions never cross-contaminate', async () => {
        await seedTriggerCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results } = await toolSearchService(log).searchTriggers('a new calendar event is created', { embedder: fakeEmbedder, limit: 10 })

        // Both triggers returned; no action (create_event / send_channel_message) leaks into the results.
        expect(triggerNames(results)).toEqual(['new_event', 'new_message'])
        expect(results.every((r) => r.triggerName !== 'create_event' && r.triggerName !== 'send_channel_message')).toBe(true)
    })

    it('searchTriggers abstains with an empty semantic result when the best cosine is below τ', async () => {
        await seedTriggerCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const response = await toolSearchService(log).searchTriggers('a new message posted to a channel', { embedder: { ...fakeEmbedder, tau: 0.99 }, limit: 5 })

        expect(response).toEqual({ results: [], mode: 'semantic' })
    })

    it('searchTriggers degrades to the keyword floor when no embedder/key is available', async () => {
        await seedTriggerCatalog()
        // No reindex, no embedder, no platformId → embedder resolves to null → keyword floor.

        const { results, mode } = await toolSearchService(log).searchTriggers('new message', { limit: 5 })

        expect(mode).toBe('keyword')
        const slack = results.find((r) => r.pieceName === '@activepieces/piece-slack')
        expect(slack).toMatchObject({
            triggerName: 'new_message',
            displayName: 'New Message',
            oneLineDescription: 'Triggers when a new message is posted to a Slack channel',
            requiresConnection: true,
        })
        // Keyword rows carry no cosine, and actions never cross into trigger results.
        expect(slack?.cosine).toBeUndefined()
        expect(results.every((r) => r.triggerName !== 'send_channel_message' && r.triggerName !== 'create_event')).toBe(true)
    })

    it('searchTriggers pieceName scope restricts results to that piece’s triggers', async () => {
        await seedTriggerCatalog()
        await toolSearchReindexService(log).reindex({ embedder: fakeEmbedder })

        const { results } = await toolSearchService(log).searchTriggers('a new message or event', { embedder: fakeEmbedder, limit: 10, pieceName: '@activepieces/piece-slack' })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every((r) => r.pieceName === '@activepieces/piece-slack')).toBe(true)
    })
})
