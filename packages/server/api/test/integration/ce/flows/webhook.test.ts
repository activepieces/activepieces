import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { FlowStatus, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
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
            url: `/v1/webhooks/${mockFlow.id}`,
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
            url: `/v1/webhooks/${MOCK_FLOW_ID}`,
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
            url: `/v1/webhooks/${mockFlow.id}`,
            headers: {
                authorization: `Bearer ${mockToken}`,
            },
        })
        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})
