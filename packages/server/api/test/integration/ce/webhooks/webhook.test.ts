import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    EngineResponseStatus,
    FlowStatus,
    PrincipalType,
    TriggerHookType,
    WebhookHandshakeStrategy,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import * as flowExecutionCacheModule from '../../../../src/app/flows/flow/flow-execution-cache'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null
const MOCK_FLOW_ID = '8hfKOpm3kY1yAi1ApYOa1'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
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

    it('should accept handshake validation for disabled flows using NONE strategy', async () => {
        const { mockProject, mockPlatform, mockOwner, mockFlow } = await setupDisabledWebhookFlow({
            handshakeConfiguration: {
                strategy: WebhookHandshakeStrategy.NONE,
            },
        })
        const handshakeSpy = mockHandshakeResponse()
        const mockToken = await generateMockToken({
            type: PrincipalType.USER,
            platform: {
                id: mockPlatform.id,
            },
            id: mockOwner.id,
        })

        const response = await app?.inject({
            method: 'HEAD',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(handshakeSpy).toHaveBeenCalledWith(expect.objectContaining({
            hookType: TriggerHookType.HANDSHAKE,
            flowId: mockFlow.id,
            projectId: mockProject.id,
        }), expect.anything())
    })

    it('should accept handshake validation for disabled flows when a body marker is present', async () => {
        const { mockProject, mockPlatform, mockOwner, mockFlow } = await setupDisabledWebhookFlow({
            handshakeConfiguration: {
                strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
                paramName: 'challenge',
            },
        })
        const handshakeSpy = mockHandshakeResponse()
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
            body: {
                challenge: '123',
            },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(handshakeSpy).toHaveBeenCalledWith(expect.objectContaining({
            hookType: TriggerHookType.HANDSHAKE,
            flowId: mockFlow.id,
            projectId: mockProject.id,
        }), expect.anything())
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

async function setupDisabledWebhookFlow({
    handshakeConfiguration,
}: SetupDisabledWebhookFlowParams): Promise<SetupDisabledWebhookFlowResult> {
    const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
    const mockFlow = createMockFlow({
        projectId: mockProject.id,
        status: FlowStatus.DISABLED,
        publishedVersionId: apId(),
    })
    vi.spyOn(flowExecutionCacheModule, 'flowExecutionCache').mockReturnValue({
        get: async () => ({
            exists: true,
            flow: mockFlow,
            platformId: mockPlatform.id,
            handshakeConfiguration,
        }),
        invalidate: async () => undefined,
    })

    return {
        mockProject,
        mockPlatform,
        mockOwner,
        mockFlow,
    }
}

function mockHandshakeResponse() {
    return vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({
        status: EngineResponseStatus.OK,
        response: {
            response: {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            },
        },
        error: undefined,
    })
}

type SetupDisabledWebhookFlowParams = {
    handshakeConfiguration: {
        strategy: WebhookHandshakeStrategy
        paramName?: string
    }
}

type SetupDisabledWebhookFlowResult = {
    mockProject: {
        id: string
    }
    mockPlatform: {
        id: string
    }
    mockOwner: {
        id: string
    }
    mockFlow: {
        id: string
    }
}
