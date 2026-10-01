import { AIProviderName, apId } from '@activepieces/core-utils'
import { AiStepAction, PlatformModelTier, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { aiRpcHandlers } from '../../../../src/app/ai/ai-rpc-handlers'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { enqueue } = vi.hoisted(() => ({ enqueue: vi.fn() }))

vi.mock('../../../../src/app/ai/ai-execution', () => ({
    aiExecution: () => ({ serverId: () => 'server-1', enqueue, waitForAnswer: vi.fn() }),
}))

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
    enqueue.mockReset().mockResolvedValue(undefined)
})

describe('tier candidates', () => {
    it('lets a tier run a key that is scoped away from the project, while a specific pick of it still fails', async () => {
        const scopedAway = await seedKey({ testCtx: ctx, projectScope: 'selected', projectIds: [] })
        const tier = await createTier({ testCtx: ctx, name: 'Expert', entries: [{ configId: scopedAway.id, modelId: 'gpt-4o' }] })

        const { tierName, candidates } = await rpc().resolveAiModelCandidates({ projectId: ctx.project.id, platformId: ctx.platform.id, modelTierId: tier.id })
        const specificPick = rpc().resolveAiProvider({ projectId: ctx.project.id, platformId: ctx.platform.id, provider: AIProviderName.CUSTOM, providerConfigId: scopedAway.id })

        expect(tierName).toBe('Expert')
        expect(candidates).toEqual([expect.objectContaining({ providerConfigId: scopedAway.id, modelId: 'gpt-4o', provider: AIProviderName.CUSTOM, status: 'active' })])
        await expect(specificPick).rejects.toThrow()
    })

    it('tries healthy keys first and keeps the tier order inside each group', async () => {
        const down = await seedKey({ testCtx: ctx })
        const up = await seedKey({ testCtx: ctx })
        await databaseConnection().getRepository('ai_provider').update({ id: down.id }, { status: 'unreachable' })
        const tier = await createTier({ testCtx: ctx, entries: [
            { configId: down.id, modelId: 'main' },
            { configId: up.id, modelId: 'first-fallback' },
            { configId: up.id, modelId: 'second-fallback' },
        ] })

        const { candidates } = await rpc().resolveAiModelCandidates({ projectId: ctx.project.id, platformId: ctx.platform.id, modelTierId: tier.id })

        expect(candidates.map((candidate) => candidate.modelId)).toEqual(['first-fallback', 'second-fallback', 'main'])
    })

    it('follows a deleted tier to its replacement', async () => {
        const key = await seedKey({ testCtx: ctx })
        const old = await createTier({ testCtx: ctx, name: 'Old', entries: [{ configId: key.id, modelId: 'old-model' }] })
        const replacement = await createTier({ testCtx: ctx, name: 'New', entries: [{ configId: key.id, modelId: 'new-model' }] })
        await ctx.delete(`${TIERS}/${old.id}`, { replacedBy: replacement.id })

        const { tierName, candidates } = await rpc().resolveAiModelCandidates({ projectId: ctx.project.id, platformId: ctx.platform.id, modelTierId: old.id })

        expect(tierName).toBe('New')
        expect(candidates.map((candidate) => candidate.modelId)).toEqual(['new-model'])
    })

    it('fails a tier that was removed without a replacement', async () => {
        const key = await seedKey({ testCtx: ctx })
        const tier = await createTier({ testCtx: ctx, entries: [{ configId: key.id, modelId: 'gpt-4o' }] })
        const removed = await ctx.delete(`${TIERS}/${tier.id}`)
        expect(removed.statusCode).toBe(StatusCodes.NO_CONTENT)

        await expect(rpc().resolveAiModelCandidates({ projectId: ctx.project.id, platformId: ctx.platform.id, modelTierId: tier.id }))
            .rejects.toMatchObject({ error: { code: 'VALIDATION', params: { message: 'This tier was removed. Pick a new model for this step.' } } })
    })

    it('never resolves another platform\'s tier', async () => {
        const otherCtx = await createTestContext(app!)
        const foreignKey = await seedKey({ testCtx: otherCtx })
        const foreignTier = await createTier({ testCtx: otherCtx, entries: [{ configId: foreignKey.id, modelId: 'gpt-4o' }] })

        await expect(rpc().resolveAiModelCandidates({ projectId: ctx.project.id, platformId: ctx.platform.id, modelTierId: foreignTier.id }))
            .rejects.toThrow()
        await expect(rpc().resolveAiModelCandidates({ projectId: ctx.project.id, platformId: otherCtx.platform.id, modelTierId: foreignTier.id }))
            .rejects.toThrow()
    })
})

describe('POST /v1/ai/execute with a tier', () => {
    it('enqueues the tier and the first model the worker will try', async () => {
        const key = await seedKey({ testCtx: ctx, projectScope: 'selected', projectIds: [] })
        const tier = await createTier({ testCtx: ctx, entries: [{ configId: key.id, modelId: 'gpt-4o' }] })

        const response = await executeAiStep({ body: { action: AiStepAction.ASK_AI, modelTierId: tier.id } })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(enqueue.mock.calls[0][0]).toMatchObject({ modelTierId: tier.id, provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'gpt-4o' })
    })

    it('refuses a tier on an image step', async () => {
        const key = await seedKey({ testCtx: ctx })
        const tier = await createTier({ testCtx: ctx, entries: [{ configId: key.id, modelId: 'gpt-4o' }] })

        const response = await executeAiStep({ body: { action: AiStepAction.GENERATE_IMAGE, modelTierId: tier.id } })

        expect(response.statusCode).not.toBe(StatusCodes.OK)
        expect(enqueue).not.toHaveBeenCalled()
    })

    it('returns not found for another platform\'s tier', async () => {
        const otherCtx = await createTestContext(app!)
        const foreignKey = await seedKey({ testCtx: otherCtx })
        const foreignTier = await createTier({ testCtx: otherCtx, entries: [{ configId: foreignKey.id, modelId: 'gpt-4o' }] })

        const response = await executeAiStep({ body: { action: AiStepAction.ASK_AI, modelTierId: foreignTier.id } })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(enqueue).not.toHaveBeenCalled()
    })

    it('refuses a body with neither a tier nor a model', async () => {
        const response = await executeAiStep({ body: { action: AiStepAction.ASK_AI } })

        expect(response.statusCode).not.toBe(StatusCodes.OK)
        expect(enqueue).not.toHaveBeenCalled()
    })
})

function rpc(): ReturnType<typeof aiRpcHandlers> {
    return aiRpcHandlers(app!.log)
}

async function seedKey({ testCtx, projectScope, projectIds }: { testCtx: TestContext, projectScope?: 'all' | 'selected', projectIds?: string[] }): Promise<{ id: string }> {
    return mockAndSaveAIProvider({
        platformId: testCtx.platform.id,
        provider: AIProviderName.CUSTOM,
        config: { baseUrl: 'https://api.example.com/v1', apiKeyHeader: 'Authorization', models: [] },
        ...(projectScope ? { projectScope } : {}),
        ...(projectIds ? { projectIds } : {}),
    })
}

async function createTier({ testCtx, name, entries }: { testCtx: TestContext, name?: string, entries: { configId: string, modelId: string }[] }): Promise<PlatformModelTier> {
    const response = await testCtx.post(TIERS, { name: name ?? 'Fast', emoji: '⚡', description: null, entries })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

async function executeAiStep({ body }: { body: Record<string, unknown> }) {
    const engineToken = await generateMockToken({
        type: PrincipalType.ENGINE,
        id: apId(),
        projectId: ctx.project.id,
        platform: { id: ctx.platform.id },
    })
    return app!.inject({
        method: 'POST',
        url: '/api/v1/ai/execute',
        headers: { authorization: `Bearer ${engineToken}` },
        body: { flowId: apId(), flowRunId: apId(), waitpointId: apId(), prompt: 'hello', ...body },
    })
}

const TIERS = '/v1/platform-model-tiers'
