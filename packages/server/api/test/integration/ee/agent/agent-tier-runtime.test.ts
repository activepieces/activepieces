import { AIProviderName, apId, ErrorCode } from '@activepieces/core-utils'
import { modelCatalog } from '@activepieces/server-utils'
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
    it('runs on a tier key limited to the chat\'s project', async () => {
        const { ctx, tier, keyId } = await tierOnKey({ servesOwnProject: true })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })

        const config = await getConfig({ ctx, conversationId: conversation.id })

        expect(config.candidates?.map((candidate) => candidate.providerConfigId)).toEqual([keyId])
        expect(config.providerConfigId).toBe(keyId)
        expect(config.platformTier).toEqual({ id: tier.id, name: 'Expert' })
    })

    it('refuses to run a tier whose main model\'s key does not serve the project', async () => {
        const { ctx, tier } = await tierOnKey({ servesOwnProject: false })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })

        await expect(getConfig({ ctx, conversationId: conversation.id })).rejects.toMatchObject({ error: { code: ErrorCode.VALIDATION, params: { message: TIER_NOT_AVAILABLE } } })
    })

    it('skips a fallback that cannot call tools', async () => {
        mockCatalogWithoutToolsFor({ modelId: NO_TOOLS_MODEL })
        const { ctx, tier, keyId } = await tierOnKey({ servesOwnProject: true, fallbackModelId: NO_TOOLS_MODEL })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })

        const config = await getConfig({ ctx, conversationId: conversation.id })

        expect(config.candidates?.map((candidate) => [candidate.providerConfigId, candidate.modelId])).toEqual([[keyId, TIER_MODEL]])
    })

    it('refuses a tier from another platform', async () => {
        const { tier } = await tierOnKey({ servesOwnProject: true })
        const otherCtx = await context()

        const response = await otherCtx.post(CONVERSATIONS_URL, { modelTierId: tier.id })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('keeps one model choice: a tier clears the model name and a model name clears the tier', async () => {
        const { ctx, tier } = await tierOnKey({ servesOwnProject: true })
        const conversation = await createConversation({ ctx, body: { modelName: 'expert', modelTierId: tier.id } })

        const pickedModel = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}`, { modelName: 'fast' })
        const pickedTier = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}`, { modelTierId: tier.id })

        expect(conversation).toMatchObject({ modelTierId: tier.id, modelName: null })
        expect(pickedModel.json()).toMatchObject({ modelName: 'fast', modelTierId: null })
        expect(pickedTier.json()).toMatchObject({ modelTierId: tier.id, modelName: null })
    })

    it('clears the model when an update sends a null model name', async () => {
        const { ctx } = await tierOnKey({ servesOwnProject: true })
        const conversation = await createConversation({ ctx, body: { modelName: 'fast' } })

        const cleared = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}`, { modelName: null })

        expect(cleared.statusCode).toBe(StatusCodes.OK)
        expect(cleared.json()).toMatchObject({ modelName: null, modelTierId: null })
    })

    it('keeps the tier when the worker saves the turn with a model name', async () => {
        const { ctx, tier } = await tierOnKey({ servesOwnProject: true })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })

        await agentRpcHandlers(app.log).saveAgentMessages({ conversationId: conversation.id, messages: [{ role: 'user', content: 'hi' }], uiMessages: [], modelName: 'smart' })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored).toMatchObject({ modelTierId: tier.id, modelName: null })
    })

    it('refuses to move to a project the tier\'s key does not serve', async () => {
        const { ctx, tier, keyId } = await tierOnKey({ servesOwnProject: true })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })
        await db.update('agent_conversation', conversation.id, { projectId: ctx.project.id })
        const target = await otherProject({ ctx })

        await expect(agentRpcHandlers(app.log).updateProjectContext({ conversationId: conversation.id, projectId: target.id, provider: AIProviderName.OPENAI, providerConfigId: keyId }))
            .rejects.toMatchObject({ error: { code: ErrorCode.AUTHORIZATION } })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.projectId).toBe(ctx.project.id)
    })

    it('moves to another project when every key of the tier serves it', async () => {
        const { ctx, tier, keyId } = await tierOnKey({ servesOwnProject: true })
        await db.update('ai_provider', keyId, { projectScope: 'all', projectIds: [] })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })
        await db.update('agent_conversation', conversation.id, { projectId: ctx.project.id })
        const target = await otherProject({ ctx })

        await agentRpcHandlers(app.log).updateProjectContext({ conversationId: conversation.id, projectId: target.id, provider: AIProviderName.OPENAI, providerConfigId: keyId })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.projectId).toBe(target.id)
    })
})

describe('a tier chat that clears or switches its project', () => {
    it('refuses to clear the project while a kept key is limited to some projects', async () => {
        const { ctx, tier, keyId } = await tierOnKey({ servesOwnProject: true })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })
        await db.update('agent_conversation', conversation.id, { projectId: ctx.project.id })

        await expect(agentRpcHandlers(app.log).updateProjectContext({ conversationId: conversation.id, projectId: null, provider: AIProviderName.OPENAI, providerConfigId: keyId }))
            .rejects.toMatchObject({ error: { code: ErrorCode.AUTHORIZATION } })
    })

    it('clears and re-selects a project when every key of the tier is open to all projects', async () => {
        const { ctx, tier, keyId } = await tierOnKey({ servesOwnProject: true })
        await db.update('ai_provider', keyId, { projectScope: 'all', projectIds: [] })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })
        await db.update('agent_conversation', conversation.id, { projectId: ctx.project.id })
        const target = await otherProject({ ctx })

        await agentRpcHandlers(app.log).updateProjectContext({ conversationId: conversation.id, projectId: null, provider: AIProviderName.OPENAI, providerConfigId: keyId })
        await agentRpcHandlers(app.log).updateProjectContext({ conversationId: conversation.id, projectId: target.id, provider: AIProviderName.OPENAI, providerConfigId: keyId })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.projectId).toBe(target.id)
    })

    it('ignores a fallback the chat cannot use when checking a switch', async () => {
        mockCatalogWithoutToolsFor({ modelId: NO_TOOLS_MODEL })
        const ctx = await context()
        const openKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const limitedKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        await db.update('ai_provider', limitedKey.id, { projectScope: 'selected', projectIds: [ctx.project.id] })
        const tier = await createTier({ ctx, entries: [{ configId: openKey.id, modelId: TIER_MODEL }, { configId: limitedKey.id, modelId: NO_TOOLS_MODEL }] })
        const conversation = await createConversation({ ctx, body: { modelTierId: tier.id } })
        await db.update('agent_conversation', conversation.id, { projectId: ctx.project.id })
        const target = await otherProject({ ctx })

        await agentRpcHandlers(app.log).updateProjectContext({ conversationId: conversation.id, projectId: target.id, provider: AIProviderName.OPENAI, providerConfigId: openKey.id })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.projectId).toBe(target.id)
    })
})

describe('a new-agent builder chat on a tier', () => {
    it('refuses a tier its builder project cannot use', async () => {
        const { ctx, tier } = await tierOnKey({ servesOwnProject: false })

        const response = await ctx.post(CONVERSATIONS_URL, { builder: true, projectId: ctx.project.id, modelTierId: tier.id })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })
})

describe('the tier grant for tools', () => {
    it('grants a model of the tier on its own key inside the project, and nothing else', async () => {
        const { ctx, tier, keyId } = await tierOnKey({ servesOwnProject: true })
        const otherKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const target = await otherProject({ ctx })
        const grant = ({ configId, modelId, projectId }: { configId: string, modelId: string, projectId: string }) => aiModelCandidates(app.log).grantedEntryConfig({ platformId: ctx.platform.id, tierId: tier.id, configId, modelId, scope: { type: 'project', projectId } })

        expect((await grant({ configId: keyId, modelId: TIER_MODEL, projectId: ctx.project.id }))?.configId).toBe(keyId)
        expect(await grant({ configId: keyId, modelId: 'another-model', projectId: ctx.project.id })).toBeNull()
        expect(await grant({ configId: otherKey.id, modelId: TIER_MODEL, projectId: ctx.project.id })).toBeNull()
        await expect(grant({ configId: keyId, modelId: TIER_MODEL, projectId: target.id })).rejects.toMatchObject({ error: { code: ErrorCode.VALIDATION } })
    })
})

describe('an agent on a platform tier', () => {
    it('keeps the tier on create instead of filling in a default model', async () => {
        const { ctx, tier } = await tierOnKey({ servesOwnProject: true })

        const agent = await createAgent({ ctx, draft: { modelTierId: tier.id, provider: AIProviderName.OPENAI, modelName: 'gpt-4o' } })

        expect(agent.draft).toMatchObject({ modelTierId: tier.id, provider: null, providerConfigId: null, modelName: null })
    })

    it('refuses a tier whose main model cannot call tools', async () => {
        mockCatalogWithoutToolsFor({ modelId: TIER_MODEL })
        const { ctx, tier } = await tierOnKey({ servesOwnProject: true })

        const response = await ctx.post('/v1/agents', agentBody({ ctx, draft: { modelTierId: tier.id } }))

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('refuses a tier whose main model\'s key does not serve the agent\'s project', async () => {
        const { ctx, tier } = await tierOnKey({ servesOwnProject: false })

        const response = await ctx.post('/v1/agents', agentBody({ ctx, draft: { modelTierId: tier.id } }))

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('can be talked to, and hands the tier to the worker', async () => {
        const { ctx, tier } = await tierOnKey({ servesOwnProject: true })
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
        const { ctx, tier } = await tierOnKey({ servesOwnProject: true })
        const conversationId = apId()

        await agentRpcHandlers(app.log).getAgentConfig({ conversationId, platformId: ctx.platform.id, projectId: ctx.project.id, userId: ctx.user.id, userMessage: 'sweep the inbox', modelName: null, modelTierId: tier.id, source: AgentRunSource.FLOW_STEP })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversationId })
        expect(stored.modelTierId).toBe(tier.id)
    })
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, aiProvidersEnabled: true } })
}

async function tierOnKey({ servesOwnProject, fallbackModelId }: { servesOwnProject: boolean, fallbackModelId?: string }): Promise<{ ctx: TestContext, tier: { id: string }, keyId: string }> {
    const ctx = await context()
    const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
    await db.update('ai_provider', key.id, { projectScope: 'selected', projectIds: servesOwnProject ? [ctx.project.id] : [] })
    const entries = [{ configId: key.id, modelId: TIER_MODEL }, ...(fallbackModelId ? [{ configId: key.id, modelId: fallbackModelId }] : [])]
    const response = await ctx.post('/v1/platform-model-tiers', { name: 'Expert', emoji: '🧠', description: null, entries })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return { ctx, tier: response.json(), keyId: key.id }
}

async function createTier({ ctx, entries }: { ctx: TestContext, entries: { configId: string, modelId: string }[] }): Promise<{ id: string }> {
    const response = await ctx.post('/v1/platform-model-tiers', { name: 'Expert', emoji: '🧠', description: null, entries })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

async function otherProject({ ctx }: { ctx: TestContext }): Promise<{ id: string }> {
    const project = createMockProject({ ownerId: ctx.user.id, platformId: ctx.platform.id })
    await db.save('project', project)
    return project
}

function mockCatalogWithoutToolsFor({ modelId }: { modelId: string }): void {
    vi.spyOn(modelCatalog, 'load').mockResolvedValue({
        lookup: (model) => model.modelId === modelId ? { supportsToolCalling: false } : undefined,
    })
}

async function createConversation({ ctx, body }: { ctx: TestContext, body: Record<string, unknown> }): Promise<AgentConversation> {
    const response = await ctx.post(CONVERSATIONS_URL, body)
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function createAgent({ ctx, draft }: { ctx: TestContext, draft: Record<string, unknown> }): Promise<{ id: string, draft: Record<string, unknown> }> {
    const response = await ctx.post('/v1/agents', agentBody({ ctx, draft }))
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

function agentBody({ ctx, draft }: { ctx: TestContext, draft: Record<string, unknown> }): Record<string, unknown> {
    return {
        projectId: ctx.project.id,
        displayName: 'Inbox sorter',
        icon: AgentIcon.MAIL,
        color: ColorName.BLUE,
        draft: { instructions: 'Sort unread mail.', provider: null, modelName: null, maxSteps: 5, tools: [], structuredOutput: [], ...draft },
    }
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
const NO_TOOLS_MODEL = 'text-only-model'
const TIER_NOT_AVAILABLE = 'This tier isn\'t available in this project. Pick another model.'
