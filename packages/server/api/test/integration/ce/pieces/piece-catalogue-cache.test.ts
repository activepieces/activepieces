import crypto from 'crypto'
import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { PackageType, PieceType, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { PieceMetadataSchema } from '../../../../src/app/pieces/metadata/piece-metadata-entity'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment } from '../../../helpers/test-setup'

const ELEVEN_MINUTES_MS = 11 * 60 * 1000

let app: FastifyInstance
let token: string

const get = async (url: string): Promise<{ body: PieceMetadataModelSummary[], sha: string }> => {
    const res = await app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(200)
    return { body: res.json<PieceMetadataModelSummary[]>(), sha: crypto.createHash('sha256').update(res.body).digest('hex') }
}

const namesOf = (pieces: PieceMetadataModelSummary[]): string[] => pieces.map((piece) => piece.name)

beforeAll(async () => {
    app = await setupTestEnvironment()
    token = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await pieceCache(app.log!).invalidate()
})

describe('translated catalogue cache stays correct', () => {
    it('shows a piece added after the cache was filled, once invalidated', async () => {
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-one', displayName: 'One', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
        }))
        await pieceCache(app.log!).invalidate()

        const first = await get('/api/v1/pieces?locale=de')
        expect(first.body).toHaveLength(1)
        expect(first.body[0].description).toBe('Eine Nachricht senden')

        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-two', displayName: 'Two', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Zweite Nachricht' } },
        }))

        const stale = await get('/api/v1/pieces?locale=de')
        expect(stale.body).toHaveLength(1)

        await pieceCache(app.log!).invalidate()
        const fresh = await get('/api/v1/pieces?locale=de')
        expect(fresh.body).toHaveLength(2)
        expect(fresh.body.map((piece) => piece.description).sort()).toEqual(['Eine Nachricht senden', 'Zweite Nachricht'])
    })

    it('picks up a changed translation after invalidation', async () => {
        const piece = createMockPieceMetadata({
            name: 'piece-retranslated', displayName: 'R', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Alte Nachricht' } },
        })
        await db.save('piece_metadata', piece)
        await pieceCache(app.log!).invalidate()
        expect((await get('/api/v1/pieces?locale=de')).body[0].description).toBe('Alte Nachricht')

        await db.update('piece_metadata', piece.id, {
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Neue Nachricht' } },
        })
        await pieceCache(app.log!).invalidate()
        expect((await get('/api/v1/pieces?locale=de')).body[0].description).toBe('Neue Nachricht')
    })

    it('does not let one request mutate what the next request sees', async () => {
        for (let i = 0; i < 3; i++) {
            await db.save('piece_metadata', createMockPieceMetadata({
                name: `piece-mut-${i}`, displayName: `Mut ${i}`, description: 'Send a message',
                pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
                i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
            }))
        }
        await pieceCache(app.log!).invalidate()

        const plainA = await get('/api/v1/pieces?locale=de')
        await get('/api/v1/pieces?locale=de&suggestionType=ACTION_AND_TRIGGER')
        await get('/api/v1/pieces?locale=de&searchQuery=nachricht&suggestionType=ACTION')
        await get('/api/v1/pieces?locale=de&audience=ai')
        await get('/api/v1/pieces?locale=en')
        await get('/api/v1/pieces?locale=de&sortBy=NAME&orderBy=DESC')
        await get('/api/v1/pieces?locale=de&sortBy=NAME&orderBy=ASC')
        await get('/api/v1/pieces?locale=de&sortBy=UPDATED&orderBy=DESC')
        await get('/api/v1/pieces?locale=de&categories=PRODUCTIVITY')
        await get('/api/v1/pieces?locale=de&includeHidden=true')
        await get('/api/v1/pieces?locale=de&suggestionType=ACTION_AND_TRIGGER')
        await get('/api/v1/pieces?locale=junk&suggestionType=ACTION')
        const plainB = await get('/api/v1/pieces?locale=de')

        expect(namesOf(plainB.body)).toEqual(namesOf(plainA.body))
        expect(plainB.sha).toBe(plainA.sha)
    })

    it('keeps locales isolated from each other', async () => {
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-multi', displayName: 'Multi', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: {
                [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
                [LocalesEnum.FRENCH]: { 'Send a message': 'Envoyer un message' },
            },
        }))
        await pieceCache(app.log!).invalidate()
        expect((await get('/api/v1/pieces?locale=de')).body[0].description).toBe('Eine Nachricht senden')
        expect((await get('/api/v1/pieces?locale=fr')).body[0].description).toBe('Envoyer un message')
        expect((await get('/api/v1/pieces?locale=ja')).body[0].description).toBe('Send a message')
        expect((await get('/api/v1/pieces?locale=en')).body[0].description).toBe('Send a message')
        expect((await get('/api/v1/pieces?locale=de')).body[0].description).toBe('Eine Nachricht senden')
    })

    it('serves concurrent first-time requests for the same locale consistently', async () => {
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-conc', displayName: 'Conc', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
        }))
        await pieceCache(app.log!).invalidate()
        const results = await Promise.all(Array.from({ length: 12 }, () => get('/api/v1/pieces?locale=de')))
        expect(new Set(results.map(r => r.sha)).size).toBe(1)
        expect(results[0].body[0].description).toBe('Eine Nachricht senden')
    })

    it('serves fresh data to a request that arrives while a fill is already running', async () => {
        const filler = Array.from({ length: 40 }, (_, i) => createMockPieceMetadata({
            name: `piece-race-filler-${i}`, displayName: `Filler ${i}`, description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
        }))
        await db.save('piece_metadata', filler)
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-race-one', displayName: 'One', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
        }))
        await pieceCache(app.log!).invalidate()

        const inFlight = get('/api/v1/pieces?locale=de')

        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-race-two', displayName: 'Two', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Zweite Nachricht' } },
        }))
        await pieceCache(app.log!).invalidate()

        const joined = await get('/api/v1/pieces?locale=de')
        await inFlight

        expect(namesOf(joined.body)).toContain('piece-race-two')

        const afterwards = await get('/api/v1/pieces?locale=de')
        expect(namesOf(afterwards.body)).toContain('piece-race-two')
        expect(afterwards.body).toHaveLength(42)
    })

    it('treats an unrecognised locale as English instead of minting a cache entry', async () => {
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-locale-bound', displayName: 'Bound', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: {
                [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
                [LocalesEnum.CHINESE_TRADITIONAL]: { 'Send a message': '傳送訊息' },
            },
        }))
        await pieceCache(app.log!).invalidate()

        const english = await get('/api/v1/pieces?locale=en')
        for (const locale of ['', 'xx', 'junk-1', 'junk-2', 'en-US', 'de-DE', 'zh-tw', 'ZH-TW', '__proto__']) {
            const unrecognised = await get(`/api/v1/pieces?locale=${encodeURIComponent(locale)}`)
            expect(unrecognised.sha).toBe(english.sha)
        }

        expect((await get('/api/v1/pieces?locale=de')).body[0].description).toBe('Eine Nachricht senden')
        expect((await get('/api/v1/pieces?locale=zh-TW')).body[0].description).toBe('傳送訊息')
        expect((await get('/api/v1/pieces?locale=en')).sha).toBe(english.sha)
    })

    it('serves props-translated suggestions from the cache, before and after an invalidation', async () => {
        const withProps = (description: string) => createMockPieceMetadata({
            name: 'piece-suggest', displayName: 'Suggest', description,
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            actions: {
                send: {
                    name: 'send', displayName: 'Send', description: 'Send a message', requireAuth: false,
                    props: { channel: { displayName: 'Channel', description: 'The channel', required: false, type: 'SHORT_TEXT' } },
                },
            },
            i18n: {
                [LocalesEnum.GERMAN]: {
                    'Send a message': 'Eine Nachricht senden', 'Send': 'Senden',
                    'Channel': 'Kanal', 'The channel': 'Der Kanal',
                },
            },
        })
        await db.save('piece_metadata', withProps('Send a message'))
        await pieceCache(app.log!).invalidate()

        const url = '/api/v1/pieces?locale=de&suggestionType=ACTION_AND_TRIGGER'
        const first = await get(url)
        const action = first.body[0].suggestedActions?.[0]
        expect(action?.displayName).toBe('Senden')
        expect(action?.props.channel.displayName).toBe('Kanal')
        expect(action?.props.channel.description).toBe('Der Kanal')
        expect((await get(url)).sha).toBe(first.sha)

        expect((await get('/api/v1/pieces?locale=de')).body[0].description).toBe('Eine Nachricht senden')

        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-suggest-two', displayName: 'Suggest Two', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
        }))
        await pieceCache(app.log!).invalidate()

        const afterwards = await get(url)
        expect(namesOf(afterwards.body).sort()).toEqual(['piece-suggest', 'piece-suggest-two'])
        const refreshed = afterwards.body.find((piece) => piece.name === 'piece-suggest')
        expect(refreshed?.suggestedActions?.[0].props.channel.displayName).toBe('Kanal')
    })

    it('serves concurrent first-time suggestion requests consistently', async () => {
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-suggest-conc', displayName: 'Conc', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
        }))
        await pieceCache(app.log!).invalidate()
        const results = await Promise.all(Array.from({ length: 12 }, () => get('/api/v1/pieces?locale=de&suggestionType=ACTION')))
        expect(new Set(results.map(r => r.sha)).size).toBe(1)
    })

    it('reflects a piece created through the service without a manual invalidate', async () => {
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-seed', displayName: 'Seed', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
        }))
        await pieceCache(app.log!).invalidate()
        expect((await get('/api/v1/pieces?locale=de')).body).toHaveLength(1)

        await pieceMetadataService(app.log!).create({
            pieceMetadata: {
                name: 'piece-created-via-service', displayName: 'Created', description: 'Send a message',
                version: '1.0.0', minimumSupportedRelease: '0.0.0', maximumSupportedRelease: '99999.99999.9999',
                actions: {}, triggers: {}, auth: undefined, categories: [], authors: [],
                logoUrl: 'https://example.com/l.png',
            },
            packageType: PackageType.REGISTRY, pieceType: PieceType.OFFICIAL,
        })

        expect((await get('/api/v1/pieces?locale=de')).body).toHaveLength(2)
    })

    it('serves a write that skipped the invalidation once the generation reaches its max age', async () => {
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-aged-one', displayName: 'Aged One', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
        }))
        await pieceCache(app.log!).invalidate()
        expect(namesOf((await get('/api/v1/pieces?locale=de')).body)).toEqual(['piece-aged-one'])

        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'piece-aged-two', displayName: 'Aged Two', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
        }))
        expect(namesOf((await get('/api/v1/pieces?locale=de')).body)).toEqual(['piece-aged-one'])

        const realNow = performance.now.bind(performance)
        const clock = vi.spyOn(performance, 'now').mockImplementation(() => realNow() + ELEVEN_MINUTES_MS)
        try {
            expect(namesOf((await get('/api/v1/pieces?locale=de')).body).sort()).toEqual(['piece-aged-one', 'piece-aged-two'])
        }
        finally {
            clock.mockRestore()
        }
    })

    it('shows a usage update in the popularity sort without a manual invalidate', async () => {
        const quiet = createMockPieceMetadata({
            name: 'piece-quiet', displayName: 'Quiet', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
        })
        const popular = createMockPieceMetadata({
            name: 'piece-popular', displayName: 'Popular', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
        })
        await db.save('piece_metadata', [quiet, popular])
        await pieceCache(app.log!).invalidate()
        const url = '/api/v1/pieces?sortBy=POPULARITY&orderBy=DESC'
        await get(url)
        const updatedBefore = (await db.findOneByOrFail<PieceMetadataSchema>('piece_metadata', { id: popular.id })).updated

        await pieceMetadataService(app.log!).updateUsages({ usages: [{ id: popular.id, usage: 5 }] })

        const sorted = (await get(url)).body
        expect(namesOf(sorted)).toEqual(['piece-popular', 'piece-quiet'])
        expect(sorted[0].projectUsage).toBe(5)
        expect((await db.findOneByOrFail<PieceMetadataSchema>('piece_metadata', { id: popular.id })).updated).toEqual(updatedBefore)
    })
})
