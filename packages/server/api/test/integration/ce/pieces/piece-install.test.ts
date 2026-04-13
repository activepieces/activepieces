import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    DefaultProjectRole,
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
import { createMemberContext, createTestContext } from '../../../helpers/test-context'

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

describe('POST /v1/pieces — private piece installation', () => {
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

    it('should reject installation by a non-platform-admin user', async () => {
        const ctx = await createTestContext(app!)
        const memberCtx = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })

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

        const response = await memberCtx.inject({
            method: 'POST',
            url: '/api/v1/pieces',
            body: formData,
        })

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})
