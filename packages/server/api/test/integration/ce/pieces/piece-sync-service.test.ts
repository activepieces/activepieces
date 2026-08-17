import {
    PackageType,
    PieceType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
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

describe('Piece Metadata Create', () => {
    it('should insert a piece via create', async () => {
        const service = pieceMetadataService(mockLog)

        await service.create({
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
            publishCacheRefresh: false,
        })

        const repo = databaseConnection().getRepository('piece_metadata')
        const allPieces = await repo.find()
        expect(allPieces).toHaveLength(1)
        expect(allPieces[0].name).toBe('piece-a')
    })

    it('should reject duplicate piece creation', async () => {
        const service = pieceMetadataService(mockLog)

        await service.create({
            pieceMetadata: {
                name: 'piece-dup',
                displayName: 'Piece Dup',
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
            publishCacheRefresh: false,
        })

        await expect(service.create({
            pieceMetadata: {
                name: 'piece-dup',
                displayName: 'Piece Dup',
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
            publishCacheRefresh: false,
        })).rejects.toThrow()
    })

    it('should bulk delete pieces', async () => {
        const service = pieceMetadataService(mockLog)

        await service.create({
            pieceMetadata: {
                name: 'delete-me',
                displayName: 'Delete Me',
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
            publishCacheRefresh: false,
        })

        await service.create({
            pieceMetadata: {
                name: 'keep-me',
                displayName: 'Keep Me',
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
            publishCacheRefresh: false,
        })

        await service.bulkDelete([{ name: 'delete-me', version: '1.0.0' }])

        const repo = databaseConnection().getRepository('piece_metadata')
        const allPieces = await repo.find()
        expect(allPieces).toHaveLength(1)
        expect(allPieces[0].name).toBe('keep-me')
    })

    it('should ignore incoming payload id and generate fresh unique primary key (#14834)', async () => {
        const service = pieceMetadataService(mockLog)

        const savedPiece1 = await service.create({
            pieceMetadata: {
                id: 'UExr6bNYWIwodXeO9vMgL', // Predefined cloud ID
                name: 'cloud-piece-1',
                displayName: 'Cloud Piece 1',
                version: '1.0.0',
                minimumSupportedRelease: '0.0.0',
                maximumSupportedRelease: '9.9.9',
                actions: {},
                triggers: {},
                authors: [],
                logoUrl: 'https://example.com/logo.png',
            } as any,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            publishCacheRefresh: false,
        })

        const savedPiece2 = await service.create({
            pieceMetadata: {
                id: 'UExr6bNYWIwodXeO9vMgL', // Duplicate predefined cloud ID on another piece
                name: 'cloud-piece-2',
                displayName: 'Cloud Piece 2',
                version: '1.0.0',
                minimumSupportedRelease: '0.0.0',
                maximumSupportedRelease: '9.9.9',
                actions: {},
                triggers: {},
                authors: [],
                logoUrl: 'https://example.com/logo.png',
            } as any,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            publishCacheRefresh: false,
        })

        expect(savedPiece1.id).not.toBe('UExr6bNYWIwodXeO9vMgL')
        expect(savedPiece2.id).not.toBe('UExr6bNYWIwodXeO9vMgL')
        expect(savedPiece1.id).not.toBe(savedPiece2.id)

        const repo = databaseConnection().getRepository('piece_metadata')
        const allPieces = await repo.find()
        expect(allPieces).toHaveLength(2)
    })
})
