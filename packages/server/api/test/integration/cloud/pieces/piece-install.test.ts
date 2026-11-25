import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EngineResponseStatus, PackageType, PieceScope } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { MockInstance } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
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
let interactionSpy: MockInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
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

describe('POST /v1/pieces — custom piece installation by plan (Cloud)', () => {
    it('rejects a custom piece before it reaches a worker when the plan has custom pieces disabled', async () => {
        const ctx = await createTestContext(app!, { plan: { customPiecesEnabled: false } })

        const response = await ctx.inject({
            method: 'POST',
            url: '/api/v1/pieces',
            body: buildArchiveForm(),
        })

        expect(response.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(response.json().code).toBe('FEATURE_DISABLED')
        expect(interactionSpy).not.toHaveBeenCalled()
        const saved = await databaseConnection().getRepository('piece_metadata').countBy({ platformId: ctx.platform.id })
        expect(saved).toBe(0)
    })

    it('installs a custom piece when the plan has custom pieces enabled', async () => {
        const ctx = await createTestContext(app!, { plan: { customPiecesEnabled: true } })

        const response = await ctx.inject({
            method: 'POST',
            url: '/api/v1/pieces',
            body: buildArchiveForm(),
        })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
    })
})

function buildArchiveForm(): FormData {
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
    return formData
}
