import { AIProviderName } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
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

        const response = await ctx.get('/v1/ai-providers/azure/models')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(mockSendRequest).toHaveBeenCalledTimes(1)
        const requestUrl = mockSendRequest.mock.calls[0][0].url
        expect(requestUrl).toContain('api-version=2023-03-15-preview')
        expect(response?.json()).toEqual([
            { id: 'my-gpt4o-deployment', name: 'my-gpt4o-deployment', type: 'text' },
        ])
    })
})
