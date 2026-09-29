import { apId } from '@activepieces/core-utils'
import { ModelTier, modelTierCatalog, ModelTierReader, ModelTierSurface } from '@activepieces/server-utils'
import { PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('GET /v1/ai-providers/tiers', () => {
    it('serves a flow list and a chat list, each with its default inside it and only id, label and modelId per tier', async () => {
        const response = await ctx.get('/v1/ai-providers/tiers')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const body = response?.json<ModelTiersResponse>()
        for (const surface of SURFACES) {
            const list = body?.[surface]
            const ids = list?.tiers.map((tier) => tier.id) ?? []
            expect(ids.length).toBeGreaterThan(0)
            expect(new Set(ids).size).toBe(ids.length)
            expect(ids).toContain(list?.defaultTierId)
            for (const tier of list?.tiers ?? []) {
                expect(Object.keys(tier).sort()).toEqual(['id', 'label', 'modelId'])
            }
        }
    })

    it('keeps the flow list and the chat list apart', async () => {
        vi.spyOn(modelTierCatalog, 'current').mockImplementation((surface) => READERS[surface])

        const response = await ctx.get('/v1/ai-providers/tiers')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const body = response?.json<ModelTiersResponse>()
        expect(body?.flow.tiers.map((tier) => tier.id)).toEqual(['fast', 'smart'])
        expect(body?.chat.tiers.map((tier) => tier.id)).toEqual(['fast', 'smart', 'turbo'])
        expect(body?.flow.defaultTierId).toBe('smart')
        expect(body?.chat.defaultTierId).toBe('turbo')
        expect(body?.flow.tiers.find((tier) => tier.id === 'smart')?.modelId).toBe('anthropic/claude-sonnet-4.6')
        expect(body?.chat.tiers.find((tier) => tier.id === 'smart')?.modelId).toBe('google/gemini-3.7-flash')
    })

    it('lets an engine token read them', async () => {
        const engineToken = await generateMockToken({
            type: PrincipalType.ENGINE,
            id: apId(),
            projectId: ctx.project.id,
            platform: { id: ctx.platform.id },
        })

        const response = await app!.inject({
            method: 'GET',
            url: '/api/v1/ai-providers/tiers',
            headers: { authorization: `Bearer ${engineToken}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json<ModelTiersResponse>().flow.tiers.length).toBeGreaterThan(0)
    })

    it('refuses a request without a token', async () => {
        const response = await app!.inject({
            method: 'GET',
            url: '/api/v1/ai-providers/tiers',
        })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})

function reader({ tiers, defaultTierId }: { tiers: ModelTier[], defaultTierId: string }): ModelTierReader {
    const tiersById = new Map(tiers.map((tier) => [tier.id, tier]))
    const defaultTier = tiers.find((tier) => tier.id === defaultTierId) ?? tiers[0]
    return {
        tiers,
        defaultTierId: defaultTier.id,
        fastTierId: 'fast',
        findTier: ({ tierId }) => tiersById.get(tierId),
        resolveTier: ({ tierId }) => (tierId ? tiersById.get(tierId) : undefined) ?? defaultTier,
    }
}

function tier({ id, label, modelId }: { id: string, label: string, modelId: string }): ModelTier {
    return { id, label, modelId, thinkingBudget: 1024 }
}

const SURFACES: ModelTierSurface[] = ['flow', 'chat']

const READERS: Record<ModelTierSurface, ModelTierReader> = {
    flow: reader({
        tiers: [
            tier({ id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5' }),
            tier({ id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-4.6' }),
        ],
        defaultTierId: 'smart',
    }),
    chat: reader({
        tiers: [
            tier({ id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5' }),
            tier({ id: 'smart', label: 'Expert', modelId: 'google/gemini-3.7-flash' }),
            tier({ id: 'turbo', label: 'Turbo', modelId: 'openai/gpt-5.5' }),
        ],
        defaultTierId: 'turbo',
    }),
}

type ModelTiersResponse = Record<ModelTierSurface, {
    tiers: { id: string, label: string, modelId: string }[]
    defaultTierId: string
}>
