import { AIProviderName } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockSendRequest } = vi.hoisted(() => ({ mockSendRequest: vi.fn() }))

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const original = await importOriginal<typeof import('@activepieces/pieces-common')>()
    return {
        ...original,
        httpClient: { ...original.httpClient, sendRequest: mockSendRequest },
    }
})

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
    mockSendRequest.mockReset()
})

describe('GET /v1/ai-providers/:provider/models (azure)', () => {
    it('lists azure deployments by id with the pinned legacy api-version', async () => {
        mockSendRequest.mockResolvedValue({
            body: { data: [{ id: 'my-gpt4o-deployment', model: 'gpt-4o', status: 'succeeded' }] },
        })
        await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.AZURE,
            displayName: 'Azure',
            config: { resourceName: 'my-resource', apiVersion: '2024-10-21' },
        })

        const response = await ctx.get('/v1/ai-providers/azure/models', { projectId: ctx.project.id })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(mockSendRequest).toHaveBeenCalledTimes(1)
        const requestUrl = mockSendRequest.mock.calls[0][0].url
        expect(requestUrl).toContain('api-version=2023-03-15-preview')
        expect(response?.json()).toEqual([
            { id: 'my-gpt4o-deployment', name: 'my-gpt4o-deployment', type: 'text' },
        ])
    })
})

describe('GET /v1/ai-providers/configs/:id/models (azure)', () => {
    it('keeps two azure resources apart even when they share an api key', async () => {
        mockSendRequest.mockImplementation((request: { url: string }) => {
            const deployment = request.url.includes('resource-a')
                ? 'deployment-a'
                : 'deployment-b'
            return Promise.resolve({
                body: { data: [{ id: deployment, model: 'gpt-4o', status: 'succeeded' }] },
            })
        })

        const first = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.AZURE,
            displayName: 'Azure A',
            config: { resourceName: 'resource-a' },
        })
        const second = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.AZURE,
            displayName: 'Azure B',
            config: { resourceName: 'resource-b' },
        })
        await db.update('ai_provider', second.id, { auth: first.auth })

        const firstResponse = await ctx.get(`/v1/ai-providers/configs/${first.id}/models`)
        const secondResponse = await ctx.get(`/v1/ai-providers/configs/${second.id}/models`)

        expect(firstResponse?.statusCode).toBe(StatusCodes.OK)
        expect(secondResponse?.statusCode).toBe(StatusCodes.OK)
        expect(firstResponse?.json().map((m: { id: string }) => m.id)).toEqual(['deployment-a'])
        expect(secondResponse?.json().map((m: { id: string }) => m.id)).toEqual(['deployment-b'])
    })
})
