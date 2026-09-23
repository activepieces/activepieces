import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import {
    PackageType,
    PieceAudienceFilter,
    PieceType,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'


let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger
let token: string

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
    token = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await pieceCache(mockLog).invalidate()
})

const GERMAN_TRANSLATIONS = { 'Send a message': 'Eine Nachricht senden' }
const UPSTREAM_VERSION = '1.0.0'

const seedUpstreamPiece = async (name: string): Promise<void> => {
    await db.save('piece_metadata', createMockPieceMetadata({
        name,
        version: UPSTREAM_VERSION,
        displayName: 'Upstream',
        description: 'Send a message',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        i18n: { [LocalesEnum.GERMAN]: GERMAN_TRANSLATIONS },
    }))
    await pieceCache(mockLog).invalidate()
}

const fetchAsPieceSyncDoes = async (name: string, extraQuery: Record<string, string> = {}): Promise<PieceMetadataModel> => {
    const queryParams = new URLSearchParams({ audience: PieceAudienceFilter.ALL, version: UPSTREAM_VERSION, ...extraQuery })
    const response = await app!.inject({
        method: 'GET',
        url: `/api/v1/pieces/${name}?${queryParams.toString()}`,
        headers: { authorization: `Bearer ${token}` },
    })
    expect(response.statusCode).toBe(200)
    return response.json<PieceMetadataModel>()
}

describe('Piece Sync Cloud Round Trip', () => {
    it.each(['piece-upstream', '@upstream/piece-scoped'])('stores exactly what the cloud serves for %s', async (name) => {
        await seedUpstreamPiece(name)
        const served = await fetchAsPieceSyncDoes(name)

        await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
        await pieceMetadataService(mockLog).create({
            pieceMetadata: served,
            packageType: served.packageType,
            pieceType: served.pieceType,
            publishCacheRefresh: false,
        })
        await pieceCache(mockLog).invalidate()

        expect(served.i18n).toEqual({ [LocalesEnum.GERMAN]: GERMAN_TRANSLATIONS })
        expect(await fetchAsPieceSyncDoes(name)).toEqual(served)
    })

    it('omits the translations when the caller opts out', async () => {
        await seedUpstreamPiece('piece-opted-out')
        const pieceMetadata = await fetchAsPieceSyncDoes('piece-opted-out', { excludeTranslations: 'true' })

        expect(pieceMetadata.i18n).toBeUndefined()
        expect(pieceMetadata.description).toBe('Send a message')
    })

    it('translates and still carries the translations for a non-English caller', async () => {
        await seedUpstreamPiece('piece-both')
        const pieceMetadata = await fetchAsPieceSyncDoes('piece-both', { locale: LocalesEnum.GERMAN })

        expect(pieceMetadata.description).toBe('Eine Nachricht senden')
        expect(pieceMetadata.i18n).toEqual({ [LocalesEnum.GERMAN]: GERMAN_TRANSLATIONS })
    })
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
})
