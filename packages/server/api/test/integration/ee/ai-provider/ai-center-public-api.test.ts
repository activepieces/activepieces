import { AIProviderName } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createServiceContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('AI Center public API', () => {
    it('ai center routes accept a platform api key', async () => {
        const { service } = await createPlatformWithApiKey({ aiProvidersEnabled: true })
        const key = await seedKey({ testCtx: service })

        const reads = await Promise.all([
            service.get(`${PROVIDERS}/configs`),
            service.get(`${TIERS}/admin`),
            service.get(TOOLS),
        ])
        const tier = await service.post(TIERS, tierBody({ configId: key.id }))
        const reorder = await service.post(`${TIERS}/reorder`, { tierIds: [tier.json().id] })
        const configuration = await service.post(CONFIGURATIONS, { aiSpecificModelsVisible: true })
        const deleteTier = await service.delete(`${TIERS}/${tier.json().id}`)
        const deleteKey = await service.delete(`${PROVIDERS}/${key.id}`)

        expect(reads.map((response) => response.statusCode)).toEqual([StatusCodes.OK, StatusCodes.OK, StatusCodes.OK])
        expect(tier.statusCode).toBe(StatusCodes.OK)
        expect(reorder.statusCode).toBe(StatusCodes.OK)
        expect(configuration.statusCode).toBe(StatusCodes.OK)
        expect(configuration.json()).toMatchObject({ aiSpecificModelsVisible: true })
        expect(deleteTier.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(deleteKey.statusCode).toBe(StatusCodes.NO_CONTENT)
    })

    it('only shows an api key its own platform', async () => {
        const mine = await createPlatformWithApiKey({ aiProvidersEnabled: true })
        const theirs = await createPlatformWithApiKey({ aiProvidersEnabled: true })
        const myKey = await seedKey({ testCtx: mine.service })
        const theirKey = await seedKey({ testCtx: theirs.service })

        const list = await mine.service.get(`${PROVIDERS}/configs`)
        await mine.service.delete(`${PROVIDERS}/${theirKey.id}`)
        const theirList = await theirs.service.get(`${PROVIDERS}/configs`)

        expect(list.json().map((config: { id: string }) => config.id)).toEqual([myKey.id])
        expect(theirList.json().map((config: { id: string }) => config.id)).toEqual([theirKey.id])
    })

    it('keeps the ai providers plan gate for api keys', async () => {
        const { service } = await createPlatformWithApiKey({ aiProvidersEnabled: false })
        const key = await seedKey({ testCtx: service })

        const create = await service.post(TIERS, tierBody({ configId: key.id }))
        const list = await service.get(`${PROVIDERS}/configs`)

        expect(create.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(list.statusCode).toBe(StatusCodes.OK)
    })
})

async function createPlatformWithApiKey({ aiProvidersEnabled }: { aiProvidersEnabled: boolean }): Promise<{ admin: TestContext, service: TestContext }> {
    const admin = await createTestContext(app, { plan: { aiProvidersEnabled } })
    const service = await createServiceContext(app, admin)
    return { admin, service }
}

async function seedKey({ testCtx }: { testCtx: TestContext }): Promise<{ id: string }> {
    return mockAndSaveAIProvider({
        platformId: testCtx.platform.id,
        provider: AIProviderName.CUSTOM,
        config: { baseUrl: 'https://api.example.com/v1', apiKeyHeader: 'Authorization', models: [] },
    })
}

function tierBody({ configId }: { configId: string }): Record<string, unknown> {
    return {
        name: 'Fast',
        emoji: '⚡',
        description: null,
        entries: [{ configId, modelId: 'gpt-4o' }],
    }
}

const PROVIDERS = '/v1/ai-providers'
const TIERS = '/v1/platform-model-tiers'
const TOOLS = '/v1/ai-tools'
const CONFIGURATIONS = '/v1/platform-configurations'
