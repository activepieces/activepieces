import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    PieceType,
    PrincipalType,
    PackageType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockPieceMetadata,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

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

describe('Piece Metadata CE API', () => {
    describe('GET /v1/pieces/categories', () => {
        it('should return piece categories', async () => {
            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/categories',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Array.isArray(body)).toBe(true)
        })
    })

    describe('GET /v1/pieces (List)', () => {
        it('should list pieces', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'ce-list-test-piece',
                pieceType: PieceType.OFFICIAL,
                displayName: 'CE List Test',
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Array.isArray(body)).toBe(true)
            expect(body).toHaveLength(1)
            expect(body[0].name).toBe('ce-list-test-piece')
        })

        it('should filter pieces by searchQuery', async () => {
            const mockPieceA = createMockPieceMetadata({
                name: 'searchable-unique-piece',
                pieceType: PieceType.OFFICIAL,
                displayName: 'Searchable Unique Piece',
                packageType: PackageType.REGISTRY,
            })
            const mockPieceB = createMockPieceMetadata({
                name: 'other-piece-xyz',
                pieceType: PieceType.OFFICIAL,
                displayName: 'Other Piece XYZ',
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceA, mockPieceB])
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces?searchQuery=Searchable+Unique',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toHaveLength(1)
            expect(body[0].name).toBe('searchable-unique-piece')
        })
    })

    describe('GET /v1/pieces/:name', () => {
        it('should get piece by name', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'ce-get-test-piece',
                pieceType: PieceType.OFFICIAL,
                displayName: 'CE Get Test',
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/ce-get-test-piece',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe('ce-get-test-piece')
            expect(body.displayName).toBe('CE Get Test')
        })

        it('should return 404 for non-existent piece', async () => {
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/non-existent-piece-xyz',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('GET /v1/pieces/:scope/:name', () => {
        it('should get piece by scope and name', async () => {
            const ctx = await createTestContext(app!)

            const mockPiece = createMockPieceMetadata({
                name: '@activepieces/ce-scoped-piece',
                pieceType: PieceType.OFFICIAL,
                displayName: 'CE Scoped Test',
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const response = await ctx.get(`/v1/pieces/@activepieces/ce-scoped-piece?projectId=${ctx.project.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe('@activepieces/ce-scoped-piece')
        })
    })

    describe('POST /v1/pieces/sync', () => {
        it('should sync pieces as platform admin', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.post('/v1/pieces/sync', {})

            // Sync should succeed (200) or be accepted
            expect([StatusCodes.OK, StatusCodes.NO_CONTENT]).toContain(response?.statusCode)
        })
    })

    describe('release-compatibility fallback', () => {
        it('GET /v1/pieces/:scope/:name falls back to the newest compatible version when latest requires a newer release', async () => {
            const compatible = createMockPieceMetadata({
                name: '@activepieces/piece-release-test',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.32',
                minimumSupportedRelease: '0.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            const incompatible = createMockPieceMetadata({
                name: '@activepieces/piece-release-test',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.33',
                minimumSupportedRelease: '99.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            await db.save('piece_metadata', [compatible, incompatible])
            await pieceCache(mockLog).setup()

            const ctx = await createTestContext(app!)
            const response = await ctx.get('/v1/pieces/@activepieces/piece-release-test')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().version).toBe('0.1.32')
        })

        it('GET /v1/pieces returns the newest compatible version in list when latest is incompatible', async () => {
            const compatible = createMockPieceMetadata({
                name: 'list-release-test-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.32',
                minimumSupportedRelease: '0.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            const incompatible = createMockPieceMetadata({
                name: 'list-release-test-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.33',
                minimumSupportedRelease: '99.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            await db.save('piece_metadata', [compatible, incompatible])
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const entry = response?.json().find((p: { name: string }) => p.name === 'list-release-test-piece')
            expect(entry).toBeDefined()
            expect(entry.version).toBe('0.1.32')
        })

        it('GET /v1/pieces/:scope/:name returns 404 when all versions are incompatible', async () => {
            const incompatible = createMockPieceMetadata({
                name: '@activepieces/piece-all-incompatible',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.33',
                minimumSupportedRelease: '99.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            await db.save('piece_metadata', incompatible)
            await pieceCache(mockLog).setup()

            const ctx = await createTestContext(app!)
            const response = await ctx.get('/v1/pieces/@activepieces/piece-all-incompatible')

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('pieceMetadataService.get() — custom pieces', () => {
        it('should return undefined for custom piece when platformId is not provided', async () => {
            const platformId = apId()
            const mockPiece = createMockPieceMetadata({
                name: '@custom/my-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const result = await pieceMetadataService(mockLog).get({
                name: '@custom/my-piece',
                version: '0.1.0',
            })
            expect(result).toBeUndefined()
        })

        it('should return custom piece when platformId is provided', async () => {
            const platformId = apId()
            const mockPiece = createMockPieceMetadata({
                name: '@custom/my-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const result = await pieceMetadataService(mockLog).get({
                name: '@custom/my-piece',
                version: '0.1.0',
                platformId,
            })
            expect(result).toBeDefined()
            expect(result?.name).toBe('@custom/my-piece')
        })
    })
})
