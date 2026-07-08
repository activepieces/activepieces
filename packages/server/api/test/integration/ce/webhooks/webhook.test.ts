import { apId, EngineResponseStatus, FlowStatus, PieceType, PrincipalType, TriggerStrategy, WebhookHandshakeStrategy } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'

let app: FastifyInstance | null = null
const MOCK_FLOW_ID = '8hfKOpm3kY1yAi1ApYOa1'
beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Webhook Service', () => {
    it('should accept webhook for enabled flow', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: { test: true },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    it('should return GONE if the flow is not found', async () => {
        const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockOwner.id,
            platform: {
                id: mockPlatform.id,
            },
        })

        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/webhooks/${MOCK_FLOW_ID}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })
        expect(response?.statusCode).toBe(StatusCodes.GONE)
    })
    it('should return NOT FOUND if the flow is disabled', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })
        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('should pass query parameters in webhook payload', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}?foo=bar&baz=qux`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: { test: true },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    it('should accept GET method', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    it('should accept PUT method', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'PUT',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: { test: true },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    it('should accept DELETE method', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'DELETE',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    it('should return x-webhook-id header in response', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: { test: true },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.headers['x-webhook-id']).toBeDefined()
    })

    it('should accept webhook on draft endpoint', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}/draft`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: { test: true },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    it('should return 413 when webhook payload exceeds MAX_WEBHOOK_PAYLOAD_SIZE_MB', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        // Generate payload larger than 25MB (default limit)
        const largePayload = { data: 'x'.repeat(26 * 1024 * 1024) }
        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: largePayload,
        })
        expect(response?.statusCode).toBe(StatusCodes.REQUEST_TOO_LONG)
    })

    it('should accept webhook payload under MAX_WEBHOOK_PAYLOAD_SIZE_MB', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: { test: true },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    it('should return 413 for sync webhook when payload exceeds limit', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, {
            publishedVersionId: mockFlowVersion.id,
        })
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const largePayload = { data: 'x'.repeat(26 * 1024 * 1024) }
        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}/sync`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: largePayload,
        })
        expect(response?.statusCode).toBe(StatusCodes.REQUEST_TOO_LONG)
    })

    it('should process handshake for DISABLED flow during publish window', async () => {
        const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

        const triggerName = 'new_webhook'
        const pieceName = 'test-handshake-piece'
        const pieceVersion = '1.0.0'

        const mockPiece = createMockPieceMetadata({
            platformId: mockPlatform.id,
            pieceType: PieceType.CUSTOM,
            name: pieceName,
            version: pieceVersion,
            triggers: {
                [triggerName]: {
                    handshakeConfiguration: {
                        strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
                        paramName: 'hub_challenge',
                    },
                },
            },
        })
        await db.save('piece_metadata', [mockPiece])

        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', [mockFlow])

        const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

        await db.save('trigger_source', [{
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            flowId: mockFlow.id,
            flowVersionId: mockFlowVersion.id,
            projectId: mockProject.id,
            pieceName,
            pieceVersion,
            triggerName,
            type: TriggerStrategy.WEBHOOK,
            simulate: false,
            schedule: null,
            deleted: null,
        }])

        const interactionSpy = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({
            status: EngineResponseStatus.OK,
            response: {
                response: {
                    status: StatusCodes.OK,
                    body: { challenge: 'test-challenge' },
                },
            },
            error: undefined,
        })

        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/webhooks/${mockFlow.id}?hub_challenge=test-challenge`,
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(interactionSpy).toHaveBeenCalled()

        interactionSpy.mockRestore()
    })

    it('should process handshake for ENABLED flow on re-verification ping', async () => {
        const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

        const triggerName = 'new_webhook'
        const pieceName = 'test-handshake-piece-enabled'
        const pieceVersion = '1.0.0'

        const mockPiece = createMockPieceMetadata({
            platformId: mockPlatform.id,
            pieceType: PieceType.CUSTOM,
            name: pieceName,
            version: pieceVersion,
            triggers: {
                [triggerName]: {
                    handshakeConfiguration: {
                        strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
                        paramName: 'hub_challenge',
                    },
                },
            },
        })
        await db.save('piece_metadata', [mockPiece])

        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', [mockFlow])

        const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

        await db.save('trigger_source', [{
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            flowId: mockFlow.id,
            flowVersionId: mockFlowVersion.id,
            projectId: mockProject.id,
            pieceName,
            pieceVersion,
            triggerName,
            type: TriggerStrategy.WEBHOOK,
            simulate: false,
            schedule: null,
            deleted: null,
        }])

        const interactionSpy = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({
            status: EngineResponseStatus.OK,
            response: {
                response: {
                    status: StatusCodes.OK,
                    body: { challenge: 'test-challenge' },
                },
            },
            error: undefined,
        })

        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/webhooks/${mockFlow.id}?hub_challenge=test-challenge`,
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(interactionSpy).toHaveBeenCalled()

        interactionSpy.mockRestore()
    })

    it('should accept webhook on test endpoint without execution', async () => {
        const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
        })
        await db.save('flow_version', [mockFlowVersion])
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })
        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}/test`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
            body: { test: true },
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })
})
