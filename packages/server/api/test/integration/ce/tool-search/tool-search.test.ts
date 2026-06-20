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
