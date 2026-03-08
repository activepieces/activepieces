import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    PackageType,
    PieceType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { PieceMetadataSchema } from '../../../../src/app/pieces/metadata/piece-metadata-entity'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import {
    createMockPieceMetadata,
} from '../../../helpers/mocks'
import { db } from '../../../helpers/db'
import dayjs from 'dayjs'


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

describe('Piece Metadata Bulk Operations', () => {
    describe('bulkCreate', () => {
        it('should insert multiple pieces in a single operation', async () => {
            const service = pieceMetadataService(mockLog)

            await service.bulkCreate([
                {
                    pieceMetadata: {
                        name: 'piece-a',
                        displayName: 'Piece A',
                        version: '1.0.0',
                        minimumSupportedRelease: '0.0.0',
                        maximumSupportedRelease: '9.9.9',
                        actions: {},
                        triggers: {},
                        authors: [],
                        logoUrl: 'https://example.com/logo.png',
                    },
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.OFFICIAL,
                },
                {
                    pieceMetadata: {
                        name: 'piece-b',
                        displayName: 'Piece B',
                        version: '2.0.0',
                        minimumSupportedRelease: '0.0.0',
                        maximumSupportedRelease: '9.9.9',
                        actions: {},
                        triggers: {},
                        authors: [],
                        logoUrl: 'https://example.com/logo.png',
                    },
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.OFFICIAL,
                },
            ])

            const repo = databaseConnection().getRepository('piece_metadata')
            const allPieces = await repo.find()
            expect(allPieces).toHaveLength(2)
            const names = allPieces.map((p: Record<string, unknown>) => p.name).sort()
            expect(names).toEqual(['piece-a', 'piece-b'])
        })

        it('should skip duplicates silently (ON CONFLICT DO NOTHING)', async () => {
            const platformId = apId()
            const existingPiece = createMockPieceMetadata({
                name: 'existing-piece',
                version: '1.0.0',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId,
            })
            await db.save('piece_metadata', existingPiece)

            const service = pieceMetadataService(mockLog)

            await service.bulkCreate([
                {
                    pieceMetadata: {
                        name: 'existing-piece',
                        displayName: 'Existing Piece',
                        version: '1.0.0',
                        minimumSupportedRelease: '0.0.0',
                        maximumSupportedRelease: '9.9.9',
                        actions: {},
                        triggers: {},
                        authors: [],
                        logoUrl: 'https://example.com/logo.png',
                    },
                    platformId,
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.CUSTOM,
                },
                {
                    pieceMetadata: {
                        name: 'new-piece',
                        displayName: 'New Piece',
                        version: '1.0.0',
                        minimumSupportedRelease: '0.0.0',
                        maximumSupportedRelease: '9.9.9',
                        actions: {},
                        triggers: {},
                        authors: [],
                        logoUrl: 'https://example.com/logo.png',
                    },
                    platformId,
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.CUSTOM,
                },
            ])

            const repo = databaseConnection().getRepository('piece_metadata')
            const allPieces = await repo.find()
            expect(allPieces).toHaveLength(2)
        })

        it('should preserve oldest created date for existing piece names', async () => {
            const oldDate = dayjs().subtract(1, 'year').toISOString()
            const existingPiece = createMockPieceMetadata({
                name: 'dated-piece',
                version: '1.0.0',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                created: oldDate,
            })
            await db.save('piece_metadata', existingPiece)

            const service = pieceMetadataService(mockLog)

            await service.bulkCreate([
                {
                    pieceMetadata: {
                        name: 'dated-piece',
                        displayName: 'Dated Piece v2',
                        version: '2.0.0',
                        minimumSupportedRelease: '0.0.0',
                        maximumSupportedRelease: '9.9.9',
                        actions: {},
                        triggers: {},
                        authors: [],
                        logoUrl: 'https://example.com/logo.png',
                    },
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.OFFICIAL,
                },
            ])

            const newVersion = await db.findOneByOrFail<PieceMetadataSchema>('piece_metadata', { name: 'dated-piece', version: '2.0.0' })
            expect(dayjs(newVersion.created).isBefore(dayjs().subtract(11, 'month'))).toBe(true)
        })

        it('should use current date for brand new piece names', async () => {
            const service = pieceMetadataService(mockLog)
            const beforeInsert = dayjs()

            await service.bulkCreate([
                {
                    pieceMetadata: {
                        name: 'brand-new-piece',
                        displayName: 'Brand New',
                        version: '1.0.0',
                        minimumSupportedRelease: '0.0.0',
                        maximumSupportedRelease: '9.9.9',
                        actions: {},
                        triggers: {},
                        authors: [],
                        logoUrl: 'https://example.com/logo.png',
                    },
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.OFFICIAL,
                },
            ])

            const piece = await db.findOneByOrFail<PieceMetadataSchema>('piece_metadata', { name: 'brand-new-piece' })
            expect(dayjs(piece.created).isAfter(beforeInsert.subtract(1, 'minute'))).toBe(true)
        })

        it('should handle empty array gracefully', async () => {
            const service = pieceMetadataService(mockLog)
            await service.bulkCreate([])

            const repo = databaseConnection().getRepository('piece_metadata')
            const allPieces = await repo.find()
            expect(allPieces).toHaveLength(0)
        })
    })
})
