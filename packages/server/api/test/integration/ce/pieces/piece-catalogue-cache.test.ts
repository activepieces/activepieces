import crypto from 'crypto'
import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PackageType, PieceType, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let token: string

const get = async (url: string): Promise<{ body: any, sha: string }> => {
    const res = await app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(200)
    return { body: res.json(), sha: crypto.createHash('sha256').update(res.body).digest('hex') }
}

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
        expect(fresh.body.map((p: any) => p.description).sort()).toEqual(['Eine Nachricht senden', 'Zweite Nachricht'])
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

        await db.update('piece_metadata', (piece as any).id, {
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
        const plainB = await get('/api/v1/pieces?locale=de')

        expect(plainB.body.map((p: any) => p.name)).toEqual(plainA.body.map((p: any) => p.name))
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
            } as any,
            projectId: undefined, platformId: undefined,
            packageType: PackageType.REGISTRY, pieceType: PieceType.OFFICIAL,
        } as any)

        expect((await get('/api/v1/pieces?locale=de')).body).toHaveLength(2)
    })
})
