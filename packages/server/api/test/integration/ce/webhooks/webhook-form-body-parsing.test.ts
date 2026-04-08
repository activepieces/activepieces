import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { FlowStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createEnabledFlow() {
    const { mockProject } = await mockAndSaveBasicSetup()
    const mockFlow = createMockFlow({
        projectId: mockProject.id,
        status: FlowStatus.ENABLED,
    })
    await db.save('flow', [mockFlow])
    const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', [mockFlowVersion])
    await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })
    return mockFlow
}

describe('Webhook form-urlencoded body parsing', () => {
    it('should accept application/x-www-form-urlencoded content type', async () => {
        const flow = await createEnabledFlow()
        const response = await app!.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${flow.id}`,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            payload: 'key=value&foo=bar',
        })
        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('should parse GitHub-style form webhook with JSON payload field', async () => {
        const flow = await createEnabledFlow()
        const githubPayload = JSON.stringify({
            zen: 'Accessible for all.',
            hook_id: 605166410,
            hook: { type: 'Repository', id: 605166410, name: 'web', active: true },
        })
        const response = await app!.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${flow.id}`,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            payload: `payload=${encodeURIComponent(githubPayload)}`,
        })
        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('should not crash on empty form body', async () => {
        const flow = await createEnabledFlow()
        const response = await app!.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${flow.id}`,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            payload: '',
        })
        expect(response.statusCode).not.toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })
})
