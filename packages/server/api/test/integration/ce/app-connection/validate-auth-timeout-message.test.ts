import { ApEnvironment, AppConnection, AppConnectionStatus, AppConnectionType, EngineResponseStatus, PackageType, PieceType } from '@activepieces/shared'
import { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
})

describe('Connection validation engine failures', () => {
    it('says the validation timed out when the engine times out on save', async () => {
        const { upsertConnection } = await setup()
        mockEngineResponse({ status: EngineResponseStatus.TIMEOUT, response: WORKER_TIMEOUT_RESPONSE })

        const response = await upsertConnection()

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        expect(response.json().code).toBe('ENGINE_OPERATION_FAILURE')
        expect(response.json().params.message).toMatch(/timed out/i)
    })

    it('keeps the generic message for other engine failures', async () => {
        const { upsertConnection } = await setup()
        mockEngineResponse({ status: EngineResponseStatus.INTERNAL_ERROR, response: undefined })

        const response = await upsertConnection()

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        expect(response.json().code).toBe('ENGINE_OPERATION_FAILURE')
        expect(response.json().params.message).toBe('Failed to run engine validate auth')
    })

    it('says the validation timed out on recheck and leaves the connection active', async () => {
        const { ctx, upsertConnection } = await setup()
        mockEngineResponse({ status: EngineResponseStatus.OK, response: { valid: true } })
        const created = await upsertConnection()
        expect(created.statusCode).toBe(StatusCodes.CREATED)
        const connectionId = created.json().id

        mockEngineResponse({ status: EngineResponseStatus.TIMEOUT, response: WORKER_TIMEOUT_RESPONSE })
        const recheck = await ctx.post(`/v1/app-connections/${connectionId}/revalidate`, {})

        expect(recheck.statusCode).toBe(StatusCodes.BAD_REQUEST)
        expect(recheck.json().params.message).toMatch(/timed out/i)
        const stored = await db.findOneByOrFail<AppConnection>('app_connection', { id: connectionId })
        expect(stored.status).toBe(AppConnectionStatus.ACTIVE)
    })
})

async function setup(): Promise<{ ctx: TestContext, upsertConnection: () => Promise<LightMyRequestResponse> }> {
    const ctx = await createTestContext(app)
    const mockPiece = createMockPieceMetadata({
        platformId: ctx.platform.id,
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.CUSTOM,
        minimumSupportedRelease: '0.0.0',
        maximumSupportedRelease: '999.999.999',
    })
    await db.save('piece_metadata', mockPiece)
    vi.stubEnv('AP_ENVIRONMENT', ApEnvironment.PRODUCTION)
    const upsertConnection = (): Promise<LightMyRequestResponse> => ctx.post('/v1/app-connections', {
        externalId: 'slow-validation',
        displayName: 'Slow validation',
        pieceName: mockPiece.name,
        projectId: ctx.project.id,
        type: AppConnectionType.SECRET_TEXT,
        value: { type: AppConnectionType.SECRET_TEXT, secret_text: 'my-secret' },
        pieceVersion: mockPiece.version,
    })
    return { ctx, upsertConnection }
}

function mockEngineResponse({ status, response }: { status: EngineResponseStatus, response: unknown }): void {
    vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({ status, response })
}

const WORKER_TIMEOUT_RESPONSE = { valid: false, error: 'Validation timed out' }
