import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
    EngineResponseStatus,
    PackageType,
    PieceScope,
    PieceType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { MockInstance } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const PIECE_NAME = 'testing-before-new-ci-discord'
const PIECE_VERSION = '0.4.4'

const tgzBuffer = readFileSync(
    join(__dirname, '../../../../src/assets/private-piece-test.tgz'),
)

const mockPieceMetadata = {
    name: PIECE_NAME,
    version: PIECE_VERSION,
    displayName: 'Discord Test Piece',
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    description: 'Test discord piece',
    auth: undefined,
    actions: {},
    triggers: {},
    minimumSupportedRelease: '0.0.0',
    maximumSupportedRelease: '999.999.999',
    authors: [],
    categories: [],
    i18n: {},
}

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger
let interactionSpy: MockInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
    interactionSpy = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({
        status: EngineResponseStatus.OK,
        response: mockPieceMetadata,
        error: undefined,
    })
})

afterEach(() => {
    interactionSpy.mockRestore()
})

// The EE install route is a separate module from the CE one, so it needs its own multipart
// coverage: the archive only reaches the handler if that route attaches attachMultipartFieldsToBody.
describe('POST /v1/pieces — private piece installation (EE)', () => {
    it('should install a private piece from a tgz archive and persist metadata', async () => {
        const ctx = await createTestContext(app!)

        const formData = new FormData()
        formData.append(
            'pieceArchive',
            new Blob([tgzBuffer], { type: 'application/gzip' }),
            'private-piece-test.tgz',
        )
        formData.append('pieceName', PIECE_NAME)
        formData.append('pieceVersion', PIECE_VERSION)
        formData.append('packageType', PackageType.ARCHIVE)
        formData.append('scope', PieceScope.PLATFORM)

        const response = await ctx.inject({
            method: 'POST',
            url: '/api/v1/pieces',
            body: formData,
        })

        expect(response.statusCode).toBe(StatusCodes.CREATED)

        const saved = await pieceMetadataService(mockLog).getOrThrow({
            name: PIECE_NAME,
            version: PIECE_VERSION,
            platformId: ctx.platform.id,
        })
        expect(saved.name).toBe(PIECE_NAME)
        expect(saved.version).toBe(PIECE_VERSION)
        expect(saved.pieceType).toBe(PieceType.CUSTOM)
        expect(saved.packageType).toBe(PackageType.ARCHIVE)
        expect(saved.archiveId).toBeDefined()
    })

    it('rejects a custom piece whose name matches an official piece with 409 and persists nothing', async () => {
        const ctx = await createTestContext(app!)

        await db.save('piece_metadata', createMockPieceMetadata({
            name: PIECE_NAME,
            version: PIECE_VERSION,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            platformId: undefined,
        }))

        const formData = new FormData()
        formData.append(
            'pieceArchive',
            new Blob([tgzBuffer], { type: 'application/gzip' }),
            'private-piece-test.tgz',
        )
        formData.append('pieceName', PIECE_NAME)
        formData.append('pieceVersion', PIECE_VERSION)
        formData.append('packageType', PackageType.ARCHIVE)
        formData.append('scope', PieceScope.PLATFORM)

        const response = await ctx.inject({
            method: 'POST',
            url: '/api/v1/pieces',
            body: formData,
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)

        const customPieces = await databaseConnection().getRepository('piece_metadata').findBy({
            name: PIECE_NAME,
            pieceType: PieceType.CUSTOM,
        })
        expect(customPieces).toHaveLength(0)
    })
})
