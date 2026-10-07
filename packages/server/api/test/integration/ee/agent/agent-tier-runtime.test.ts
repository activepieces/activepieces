import { AIProviderName, apId, ErrorCode } from '@activepieces/core-utils'
import { AgentConversation, AgentIcon, AgentRunSource, ColorName, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { aiModelCandidates } from '../../../../src/app/ai/ai-model-candidates'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockProject, mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const originalJobQueue = jobQueueModule.jobQueue

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('a chat on a platform tier', () => {
    it('runs on a tier key that is scoped away from the project, because the tier grants it', async () => {
        const { ctx, tier, keyId } = await tierOnScopedAwayKey()
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })

        const config = await getConfig({ ctx, conversationId: conversation.id })

        expect(config.candidates?.map((candidate) => candidate.providerConfigId)).toEqual([keyId])
        expect(config.providerConfigId).toBe(keyId)
        expect(config.platformTier).toEqual({ id: tier.id, name: 'Expert' })
    })

    it('cannot reach the same key as a specific model, because the key does not serve the project', async () => {
        const { ctx, keyId } = await tierOnScopedAwayKey()
        const conversation = await createConversation({ ctx, body: {} })

        await expect(getConfig({ ctx, conversationId: conversation.id, provider: AIProviderName.OPENAI, providerConfigId: keyId })).rejects.toMatchObject({ error: { code: ErrorCode.ENTITY_NOT_FOUND } })
    })

    it('refuses a tier from another platform', async () => {
        const { tier } = await tierOnScopedAwayKey()
        const otherCtx = await context()

        const response = await otherCtx.post(CONVERSATIONS_URL, { modelTierId: tier.id })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('keeps one model choice: a tier clears the model name and a model name clears the tier', async () => {
        const { ctx, tier } = await tierOnScopedAwayKey()
        const conversation = await createConversation({ ctx, body: { modelName: 'expert', modelTierId: tier.id } })

        const pickedModel = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}`, { modelName: 'fast' })
        const pickedTier = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}`, { modelTierId: tier.id })

        expect(conversation).toMatchObject({ modelTierId: tier.id, modelName: null })
        expect(pickedModel.json()).toMatchObject({ modelName: 'fast', modelTierId: null })
        expect(pickedTier.json()).toMatchObject({ modelTierId: tier.id, modelName: null })
    })

    it('keeps the tier when the worker saves the turn with a model name', async () => {
        const { ctx, tier } = await tierOnScopedAwayKey()
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })

        await agentRpcHandlers(app.log).saveAgentMessages({ conversationId: conversation.id, messages: [{ role: 'user', content: 'hi' }], uiMessages: [], modelName: 'smart' })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored).toMatchObject({ modelTierId: tier.id, modelName: null })
    })

    it('moves to another project on a tier key that serves neither project', async () => {
        const { ctx, tier, keyId } = await tierOnScopedAwayKey()
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })
        await db.update('agent_conversation', conversation.id, { projectId: ctx.project.id })
        const target = createMockProject({ ownerId: ctx.user.id, platformId: ctx.platform.id })
        await db.save('project', target)

        await agentRpcHandlers(app.log).updateProjectContext({ conversationId: conversation.id, projectId: target.id, provider: AIProviderName.OPENAI, providerConfigId: keyId })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.projectId).toBe(target.id)
    })
})

describe('the tier grant for tools', () => {
    it('grants a model of the tier on its own key, and nothing else', async () => {
        const { ctx, tier, keyId } = await tierOnScopedAwayKey()
        const otherKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const grant = (configId: string, modelId: string) => aiModelCandidates(app.log).grantedEntryConfig({ platformId: ctx.platform.id, tierId: tier.id, configId, modelId })

        expect((await grant(keyId, TIER_MODEL))?.configId).toBe(keyId)
        expect(await grant(keyId, 'another-model')).toBeNull()
        expect(await grant(otherKey.id, TIER_MODEL)).toBeNull()
    })
})

describe('an agent on a platform tier', () => {
    it('keeps the tier on create instead of filling in a default model', async () => {
        const { ctx, tier } = await tierOnScopedAwayKey()

        const agent = await createAgent({ ctx, draft: { modelTierId: tier.id, provider: AIProviderName.OPENAI, modelName: 'gpt-4o' } })

        expect(agent.draft).toMatchObject({ modelTierId: tier.id, provider: null, providerConfigId: null, modelName: null })
    })

    it('can be talked to, and hands the tier to the worker', async () => {
        const { ctx, tier } = await tierOnScopedAwayKey()
        const add = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({ ...originalJobQueue(log), add }))
        const agent = await createAgent({ ctx, draft: { modelTierId: tier.id } })
        const conversation = await createConversation({ ctx, body: { agentId: agent.id } })

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'hello' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const job = add.mock.calls.map(([call]) => call).find((call) => call.data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)
        expect(job.data.modelTierId).toBe(tier.id)
    })

    it('records the tier a flow step ran on, so its tools are granted the same keys', async () => {
        const { ctx, tier } = await tierOnScopedAwayKey()
        const conversationId = apId()

        await agentRpcHandlers(app.log).getAgentConfig({ conversationId, platformId: ctx.platform.id, projectId: ctx.project.id, userId: ctx.user.id, userMessage: 'sweep the inbox', modelName: null, modelTierId: tier.id, source: AgentRunSource.FLOW_STEP })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversationId })
        expect(stored.modelTierId).toBe(tier.id)
    })
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, aiProvidersEnabled: true } })
}

async function tierOnScopedAwayKey(): Promise<{ ctx: TestContext, tier: { id: string }, keyId: string }> {
    const ctx = await context()
    const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
    await db.update('ai_provider', key.id, { projectScope: 'selected', projectIds: [] })
    const response = await ctx.post('/v1/platform-model-tiers', { name: 'Expert', emoji: '🧠', description: null, entries: [{ configId: key.id, modelId: TIER_MODEL }] })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return { ctx, tier: response.json(), keyId: key.id }
}

async function createConversation({ ctx, body }: { ctx: TestContext, body: Record<string, unknown> }): Promise<AgentConversation> {
    const response = await ctx.post(CONVERSATIONS_URL, body)
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function createAgent({ ctx, draft }: { ctx: TestContext, draft: Record<string, unknown> }): Promise<{ id: string, draft: Record<string, unknown> }> {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Inbox sorter',
        icon: AgentIcon.MAIL,
        color: ColorName.BLUE,
        draft: { instructions: 'Sort unread mail.', provider: null, modelName: null, maxSteps: 5, tools: [], structuredOutput: [], ...draft },
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function getConfig({ ctx, conversationId, provider, providerConfigId }: { ctx: TestContext, conversationId: string, provider?: AIProviderName, providerConfigId?: string }): ReturnType<ReturnType<typeof agentRpcHandlers>['getAgentConfig']> {
    return agentRpcHandlers(app.log).getAgentConfig({
        conversationId,
        platformId: ctx.platform.id,
        userId: ctx.user.id,
        userMessage: 'hello',
        modelName: null,
        dryRun: true,
        ...(provider ? { provider } : {}),
        ...(providerConfigId ? { providerConfigId } : {}),
    })
}

const CONVERSATIONS_URL = '/v1/agents/conversations'
const TIER_MODEL = 'gpt-4o'
