import { apDayjs } from '@activepieces/server-utils'
import {
    EngineResponseStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('POST /v1/pieces/options — engine failure propagation', () => {
    const setupCallable = async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup()

        const mockFlow = createMockFlow({ projectId: mockProject.id })
        await db.save('flow', mockFlow)

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
            state: FlowVersionState.DRAFT,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                displayName: 'Catch Webhook',
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '~0.1.29',
                    triggerName: 'catch_webhook',
                    input: { authType: 'basic' },
                    propertySettings: {},
                },
                valid: true,
                lastUpdatedDate: apDayjs().toISOString(),
            },
        })
        await db.save('flow_version', mockFlowVersion)

        const mockPiece = createMockPieceMetadata({
            name: '@activepieces/piece-webhook',
            version: '0.1.29',
            platformId: undefined,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        await databaseConnection().getRepository('piece_metadata').save(mockPiece)

        const token = await generateMockToken({
            id: mockOwner.id,
            type: PrincipalType.USER,
            platform: { id: mockPlatform.id },
        })

        return { mockProject, mockFlow, mockFlowVersion, token }
    }

    const requestBody = (ids: { projectId: string, flowId: string, flowVersionId: string }) => ({
        projectId: ids.projectId,
        flowId: ids.flowId,
        flowVersionId: ids.flowVersionId,
        pieceName: '@activepieces/piece-webhook',
        pieceVersion: '~0.1.29',
        actionOrTriggerName: 'catch_webhook',
        propertyName: 'authFields',
        input: { authType: 'basic' },
    })

    it('returns ENGINE_OPERATION_FAILURE + engine errorMessage when the property job fails', async () => {
        const { mockProject, mockFlow, mockFlowVersion, token } = await setupCallable()

        const spy = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({
            status: EngineResponseStatus.INTERNAL_ERROR,
            response: undefined,
            error: 'Failed to fetch piece bundle @activepieces/piece-ai@0.4.0: 404 Not Found',
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/pieces/options',
            headers: { authorization: `Bearer ${token}` },
            body: requestBody({
                projectId: mockProject.id,
                flowId: mockFlow.id,
                flowVersionId: mockFlowVersion.id,
            }),
        })

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        const body = response.json()
        expect(body.code).toBe('ENGINE_OPERATION_FAILURE')
        expect(body.params.message).toContain('404 Not Found')
        expect(body.params.context.status).toBe(EngineResponseStatus.INTERNAL_ERROR)

        spy.mockRestore()
    })

    it('returns a synthesized message on TIMEOUT (no engine errorMessage)', async () => {
        const { mockProject, mockFlow, mockFlowVersion, token } = await setupCallable()

        const spy = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({
            status: EngineResponseStatus.TIMEOUT,
            response: {},
            error: undefined,
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/pieces/options',
            headers: { authorization: `Bearer ${token}` },
            body: requestBody({
                projectId: mockProject.id,
                flowId: mockFlow.id,
                flowVersionId: mockFlowVersion.id,
            }),
        })

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        const body = response.json()
        expect(body.code).toBe('ENGINE_OPERATION_FAILURE')
        expect(body.params.message).toMatch(/timed out/i)
        expect(body.params.context.status).toBe(EngineResponseStatus.TIMEOUT)

        spy.mockRestore()
    })
})
