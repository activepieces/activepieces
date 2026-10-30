import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PackageType, PieceType, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { generateMockToken } from '../../../helpers/auth'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
})

describe('piece translations stored per locale', () => {
    it('are written on create and served from piece_translation for the list and single routes', async () => {
        const syncedMetadata = createMockPieceMetadata({
            name: 'translated-on-create',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            description: 'Send a message',
            i18n: {
                [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
            },
        })
        const saved = await pieceMetadataService(mockLog).create({
            pieceMetadata: syncedMetadata,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        await databaseConnection().query('UPDATE "piece_metadata" SET "i18n" = NULL WHERE "id" = $1', [saved.id])
        await pieceCache(mockLog).setup()
        const headers = { authorization: `Bearer ${await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })}` }

        const [germanList, germanSingle, frenchSingle] = await Promise.all([
            app?.inject({ method: 'GET', url: '/api/v1/pieces?locale=de', headers }),
            app?.inject({ method: 'GET', url: '/api/v1/pieces/translated-on-create?locale=de', headers }),
            app?.inject({ method: 'GET', url: '/api/v1/pieces/translated-on-create?locale=fr', headers }),
        ])

        expect(saved.id).toBe(syncedMetadata.id)
        expect(germanList?.json()[0].description).toBe('Eine Nachricht senden')
        expect(germanSingle?.json().description).toBe('Eine Nachricht senden')
        expect(frenchSingle?.json().description).toBe('Send a message')
        expect(germanSingle?.json().i18n).toBeUndefined()
    })

    it('are returned for every locale by the single route when no locale is requested, so self-hosted sync keeps them', async () => {
        const saved = await pieceMetadataService(mockLog).create({
            pieceMetadata: createMockPieceMetadata({
                name: 'synced-with-all-locales',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                description: 'Send a message',
                i18n: {
                    [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
                    [LocalesEnum.JAPANESE]: { 'Send a message': 'メッセージを送信' },
                },
            }),
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        await databaseConnection().query('UPDATE "piece_metadata" SET "i18n" = NULL WHERE "id" = $1', [saved.id])
        await pieceCache(mockLog).setup()
        const headers = { authorization: `Bearer ${await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })}` }

        const [registryFetch, englishFetch] = await Promise.all([
            app?.inject({ method: 'GET', url: `/api/v1/pieces/synced-with-all-locales?audience=all&version=${saved.version}`, headers }),
            app?.inject({ method: 'GET', url: '/api/v1/pieces/synced-with-all-locales?locale=en', headers }),
        ])

        expect(registryFetch?.json().i18n).toEqual({
            [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
            [LocalesEnum.JAPANESE]: { 'Send a message': 'メッセージを送信' },
        })
        expect(registryFetch?.json().description).toBe('Send a message')
        expect(englishFetch?.json().i18n).toBeUndefined()
    })

    it('fall back to the legacy i18n column for the single route when no piece_translation rows exist', async () => {
        const saved = await pieceMetadataService(mockLog).create({
            pieceMetadata: createMockPieceMetadata({ name: 'legacy-i18n-only', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY }),
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        const legacyI18n = { [LocalesEnum.JAPANESE]: { 'Send a message': 'メッセージを送信' } }
        await databaseConnection().query('UPDATE "piece_metadata" SET "i18n" = $1 WHERE "id" = $2', [legacyI18n, saved.id])
        await databaseConnection().query('DELETE FROM "piece_translation" WHERE "pieceMetadataId" = $1', [saved.id])
        await pieceCache(mockLog).setup()
        const headers = { authorization: `Bearer ${await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })}` }

        const response = await app?.inject({ method: 'GET', url: '/api/v1/pieces/legacy-i18n-only', headers })

        expect(response?.json().i18n).toEqual(legacyI18n)
    })

    it('are saved with characters Postgres jsonb rejects stripped from keys and values', async () => {
        const saved = await pieceMetadataService(mockLog).create({
            pieceMetadata: createMockPieceMetadata({
                name: 'translations-with-nul',
                i18n: { [LocalesEnum.GERMAN]: { 'Send\u0000 a message': 'Eine\u0000 Nachricht senden' } },
            }),
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })

        const [row] = await databaseConnection().query('SELECT "translations" FROM "piece_translation" WHERE "pieceMetadataId" = $1', [saved.id])
        expect(row.translations).toEqual({ 'Send a message': 'Eine Nachricht senden' })
    })

    it('are removed with their piece', async () => {
        const piece = createMockPieceMetadata({
            name: 'deleted-with-translations',
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' } },
        })
        const saved = await pieceMetadataService(mockLog).create({
            pieceMetadata: piece,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })

        await pieceMetadataService(mockLog).bulkDelete([{ name: saved.name, version: saved.version }])

        const rows = await databaseConnection().query('SELECT 1 FROM "piece_translation" WHERE "pieceMetadataId" = $1', [saved.id])
        expect(rows).toHaveLength(0)
    })
})
