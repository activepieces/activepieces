import { AIProviderName, assertNotNullOrUndefined, ErrorCode } from '@activepieces/core-utils'
import { aiUtils, modelCatalog, modelTierCatalog } from '@activepieces/server-utils'
import { AgentConversation, AIProviderModelType, aiProviderUtils, AiToolCapability, AiToolProvider, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { aiToolConfigService } from '../../../../src/app/ai/ai-tool-config-service'
import { aiProviders } from '../../../../src/app/ai/providers'
import { agentChatModel } from '../../../../src/app/ee/agent/agent-chat-model'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { knowledgeBaseService } from '../../../../src/app/knowledge-base/knowledge-base.service'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
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

describe('a chat pinned to a key', () => {
    it('runs on that key even when another key is the Default AI key', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })

        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'team-model' } })
        const config = await getConfig({ ctx, conversationId: conversation.id })

        expect(config.providerConfigId).toBe(key.id)
        expect(config.modelId).toBe('team-model')
    })

    it('accepts and runs a model the key lists that is not on the recommended list', async () => {
        const ctx = await context()
        vi.spyOn(aiProviders[AIProviderName.OPENAI], 'listModels').mockResolvedValue([{ id: 'gpt-4o', name: 'GPT-4o', type: AIProviderModelType.TEXT }])
        vi.spyOn(modelCatalog, 'load').mockResolvedValue({ lookup: ({ modelId }) => modelId === 'gpt-4o' ? { supportsToolCalling: true } : undefined })
        const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })

        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'gpt-4o' } })
        const config = await getConfig({ ctx, conversationId: conversation.id })

        expect(config.providerConfigId).toBe(key.id)
        expect(config.modelId).toBe('gpt-4o')
    })

    it('is refused when the key does not serve the chat\'s project', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Elsewhere', models: ['team-model'], projectScope: 'selected', projectIds: [] })

        const response = await ctx.post(CONVERSATIONS_URL, { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'team-model' })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('is refused on a chat that has no project yet', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })

        const response = await ctx.post(CONVERSATIONS_URL, { providerConfigId: key.id, modelName: 'team-model' })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('fails clearly when the key no longer lists its model, instead of sending it to the vendor', async () => {
        const ctx = await context()
        vi.spyOn(aiProviders[AIProviderName.OPENAI], 'listModels').mockResolvedValue([{ id: 'gpt-5.5', name: 'GPT-5.5', type: AIProviderModelType.TEXT }])
        const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id } })
        await db.update('agent_conversation', conversation.id, { providerConfigId: key.id, modelName: 'gpt-retired-model' })

        await expect(getConfig({ ctx, conversationId: conversation.id })).rejects.toMatchObject({ error: { code: ErrorCode.VALIDATION } })
    })

    it('is refused for a model the key does not offer', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })

        const response = await ctx.post(CONVERSATIONS_URL, { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'not-offered' })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('fails clearly when its model has left the key, instead of swapping it', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'team-model' } })
        await db.update('agent_conversation', conversation.id, { modelName: 'retired-model' })

        await expect(getConfig({ ctx, conversationId: conversation.id })).rejects.toMatchObject({ error: { code: ErrorCode.VALIDATION } })
    })

    it('runs the model stored on the conversation, not an older one the queued job carried', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'team-model' } })

        const config = await getConfig({ ctx, conversationId: conversation.id, modelName: 'model-from-before-the-switch' })

        expect(config.modelId).toBe('team-model')
    })

    it('keeps its model when the worker saves the turn with a tier name', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'team-model' } })

        await agentRpcHandlers(app.log).saveAgentMessages({ conversationId: conversation.id, messages: [{ role: 'user', content: 'hi' }], uiMessages: [], modelName: 'smart' })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored).toMatchObject({ providerConfigId: key.id, modelName: 'team-model' })
    })

    it('goes back to the legacy path when its key is deleted', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'team-model' } })

        await aiProviderService(app.log).delete(ctx.platform.id, key.id)

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.providerConfigId).toBeNull()
    })

    it('is unpinned when its key stops serving the chat\'s project', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'team-model' } })

        await aiProviderService(app.log).update(ctx.platform.id, key.id, { displayName: 'Team', projectScope: 'selected', projectIds: [] })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.providerConfigId).toBeNull()
    })
})

describe('a legacy chat that stores only a model name', () => {
    it('keeps its model and pins the Default AI key after the first turn', async () => {
        const ctx = await context()
        const chatKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const model = curatedOpenAiModel()
        const conversation = await createConversation({ ctx, body: { modelName: model } })

        const first = await getConfig({ ctx, conversationId: conversation.id, dryRun: false })
        await releaseRun({ conversationId: conversation.id })
        const second = await getConfig({ ctx, conversationId: conversation.id })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored).toMatchObject({ providerConfigId: chatKey.id, modelName: model })
        expect([first.modelId, second.modelId]).toEqual([model, model])
    })

    it('keeps a tier name on an own key, so later turns keep its model and thinking', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const tierId = nonDefaultChatTierId()
        const conversation = await createConversation({ ctx, body: { modelName: tierId } })

        const first = await getConfig({ ctx, conversationId: conversation.id, dryRun: false })
        await releaseRun({ conversationId: conversation.id })
        const second = await getConfig({ ctx, conversationId: conversation.id, dryRun: false })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.modelName).toBe(tierId)
        expect(second.modelId).toBe(first.modelId)
        expect(second.tier).toEqual(first.tier)
        expect(first.tier.id).toBe(tierId)
    })

    it('pins the tier that ran when an OpenRouter chat\'s model name is unknown, so the next turn still works', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER, enabledForChat: true })
        const conversation = await createConversation({ ctx, body: { modelName: 'a-retired-tier' } })

        const first = await getConfig({ ctx, conversationId: conversation.id, dryRun: false })
        await releaseRun({ conversationId: conversation.id })
        const second = await getConfig({ ctx, conversationId: conversation.id, dryRun: false })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.modelName).toBe(first.tier.id)
        expect(second.modelId).toBe(first.modelId)
    })

    it('is not pinned to a key deleted while its turn was being set up', async () => {
        const ctx = await context()
        const chatKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const model = curatedOpenAiModel()
        const conversation = await createConversation({ ctx, body: { modelName: model } })
        await aiProviderService(app.log).delete(ctx.platform.id, chatKey.id)

        await agentChatModel(app.log).persistPick({ platformId: ctx.platform.id, projectId: ctx.project.id, conversationId: conversation.id, loadedModelName: model, pick: { modelTierId: null, providerConfigId: chatKey.id, modelName: model } })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.providerConfigId).toBeNull()
    })

    it('moves to the Default tier when the platform no longer has a Default AI key', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        await createTier({ ctx, entries: [{ configId: key.id, modelId: 'team-model' }] })
        const conversation = await createConversation({ ctx, body: { modelName: 'a-model-from-the-deleted-key' } })

        const config = await getConfig({ ctx, conversationId: conversation.id })

        expect(config.providerConfigId).toBe(key.id)
        expect(config.modelId).toBe('team-model')
    })

    it('still falls back when its model is unknown, so an upgrade never breaks it', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const conversation = await createConversation({ ctx, body: { modelName: 'a-retired-model' } })

        const config = await getConfig({ ctx, conversationId: conversation.id })

        expect(config.modelId).not.toBe('a-retired-model')
    })
})

describe('a chat with no model picked', () => {
    it('stores the platform default on its first turn', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        const tier = await createTier({ ctx, entries: [{ configId: key.id, modelId: 'team-model' }] })
        const conversation = await createConversation({ ctx, body: {} })

        await getConfig({ ctx, conversationId: conversation.id, dryRun: false })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored).toMatchObject({ modelTierId: tier.id, providerConfigId: null, modelName: null })
    })

    it('stores the Default AI key and its first known chat model when no default chat model is set', async () => {
        const ctx = await context()
        vi.spyOn(aiProviders[AIProviderName.OPENAI], 'listModels').mockResolvedValue([{ id: 'gpt-4o', name: 'GPT-4o', type: AIProviderModelType.TEXT }, { id: curatedOpenAiModel(), name: 'Curated', type: AIProviderModelType.TEXT }])
        const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id } })

        await getConfig({ ctx, conversationId: conversation.id, dryRun: false })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored).toMatchObject({ modelTierId: null, providerConfigId: key.id, modelName: curatedOpenAiModel() })
    })

    it('stores the platform default chat model, even when a Default tier exists', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model', 'other-model'] })
        await createTier({ ctx, entries: [{ configId: key.id, modelId: 'team-model' }] })
        const saved = await ctx.post('/v1/platform-configurations', { defaultChatModel: { type: 'model', provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'other-model' } })
        expect(saved.statusCode).toBe(StatusCodes.OK)
        const conversation = await createConversation({ ctx, body: { projectId: ctx.project.id } })

        await getConfig({ ctx, conversationId: conversation.id, dryRun: false })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored).toMatchObject({ modelTierId: null, providerConfigId: key.id, modelName: 'other-model' })
    })

    it('keeps the legacy path when the Default AI key\'s models cannot be listed', async () => {
        const ctx = await context()
        vi.spyOn(aiProviders[AIProviderName.OPENAI], 'listModels').mockRejectedValue(new Error('provider down'))
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })

        const pick = await agentChatModel(app.log).defaultPick({ platformId: ctx.platform.id, projectId: ctx.project.id })

        expect(pick).toBeNull()
    })

    it('can be talked to on a platform that has tiers but no Default AI key', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        await createTier({ ctx, entries: [{ configId: key.id, modelId: 'team-model' }] })
        const add = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({ ...originalJobQueue(log), add }))
        const conversation = await createConversation({ ctx, body: {} })

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'hello' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(add.mock.calls.some(([call]) => call.data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)).toBe(true)
    })
})

describe('platform-wide AI work', () => {
    it('runs on the Default tier\'s main model when there is no Default AI key and its key serves every project', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })
        await createTier({ ctx, entries: [{ configId: key.id, modelId: 'team-model' }] })

        const work = await agentHelpers.resolvePlatformWorkModel({ platformId: ctx.platform.id, log: app.log })

        expect(work).toMatchObject({ config: { configId: key.id }, modelId: 'team-model' })
    })

    it('runs memory on the Fast tier\'s main model, not the Default tier\'s', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['big-model', 'small-model'] })
        await createTier({ ctx, entries: [{ configId: key.id, modelId: 'big-model' }] })
        const fast = await createTier({ ctx, name: 'Quick', entries: [{ configId: key.id, modelId: 'small-model' }] })
        expect((await ctx.post(`/v1/platform-model-tiers/${fast.id}`, { isFast: true })).statusCode).toBe(StatusCodes.OK)
        const createModel = vi.spyOn(aiUtils, 'createModel')

        await agentHelpers.resolvePlatformFastModel({ platformId: ctx.platform.id, log: app.log })

        expect(createModel).toHaveBeenCalledWith(expect.objectContaining({ providerConfigId: key.id, modelId: 'small-model' }))
    })

    it('does not use a Default tier whose main key is limited to some projects', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'], projectScope: 'selected', projectIds: [ctx.project.id] })
        await createTier({ ctx, entries: [{ configId: key.id, modelId: 'team-model' }] })

        const work = await agentHelpers.resolvePlatformWorkModel({ platformId: ctx.platform.id, log: app.log })

        expect(work).toBeNull()
    })
})

describe('knowledge base embeddings', () => {
    it('upload and query both embed with the Embeddings key, not the Default AI key', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.ANTHROPIC, enabledForChat: true })
        const embeddingsKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        await aiToolConfigService(app.log).upsert(ctx.platform.id, { capability: AiToolCapability.EMBEDDINGS, provider: AiToolProvider.AI_PROVIDER, config: { aiProviderId: embeddingsKey.id } })
        const createEmbeddingModel = vi.spyOn(aiUtils, 'createEmbeddingModel')

        await knowledgeBaseService(app.log).embedderFor({ platformId: ctx.platform.id, projectId: ctx.project.id })

        expect(createEmbeddingModel).toHaveBeenCalledWith(expect.objectContaining({ providerConfigId: embeddingsKey.id }))
    })

    it('embeds with the picked model, even on a key whose chat models are narrowed', async () => {
        const ctx = await context()
        const embeddingsKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, modelScope: 'selected', modelIds: ['gpt-4o'] })
        await aiToolConfigService(app.log).upsert(ctx.platform.id, { capability: AiToolCapability.EMBEDDINGS, provider: AiToolProvider.AI_PROVIDER, config: { aiProviderId: embeddingsKey.id, modelId: 'text-embedding-3-large' } })
        const createEmbeddingModel = vi.spyOn(aiUtils, 'createEmbeddingModel')

        await knowledgeBaseService(app.log).embedderFor({ platformId: ctx.platform.id, projectId: ctx.project.id })
        await aiProviderService(app.log).update(ctx.platform.id, embeddingsKey.id, { displayName: 'OpenAI', modelScope: 'selected', modelIds: ['gpt-4o-mini'] })

        expect(createEmbeddingModel).toHaveBeenCalledWith(expect.objectContaining({ providerConfigId: embeddingsKey.id, modelId: 'text-embedding-3-large' }))
    })

    it('refuses an embedding model the provider does not list', async () => {
        const ctx = await context()
        const embeddingsKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })

        await expect(aiToolConfigService(app.log).upsert(ctx.platform.id, { capability: AiToolCapability.EMBEDDINGS, provider: AiToolProvider.AI_PROVIDER, config: { aiProviderId: embeddingsKey.id, modelId: 'gpt-4o' } }))
            .rejects.toMatchObject({ error: { code: ErrorCode.VALIDATION } })
    })

    it('tells project members which provider and model embed their files', async () => {
        const ctx = await context()
        const embeddingsKey = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        await aiToolConfigService(app.log).upsert(ctx.platform.id, { capability: AiToolCapability.EMBEDDINGS, provider: AiToolProvider.AI_PROVIDER, config: { aiProviderId: embeddingsKey.id, modelId: 'text-embedding-3-large' } })

        const response = await ctx.get(EMBEDDING_SOURCE_URL, { projectId: ctx.project.id })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual({ provider: AIProviderName.OPENAI, modelId: 'text-embedding-3-large' })
    })

    it('reports no embedding source when the Default AI key cannot embed and nothing is picked', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.ANTHROPIC, enabledForChat: true })

        const response = await ctx.get(EMBEDDING_SOURCE_URL, { projectId: ctx.project.id })

        expect(response.json()).toEqual({ provider: null, modelId: null })
    })

    it('does not tell another platform\'s user about a project\'s embedding source', async () => {
        const ctx = await context()
        const outsider = await context()

        const response = await outsider.get(EMBEDDING_SOURCE_URL, { projectId: ctx.project.id })

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('refuses an Embeddings choice that is not one of the platform\'s AI keys', async () => {
        const ctx = await context()

        await expect(aiToolConfigService(app.log).upsert(ctx.platform.id, { capability: AiToolCapability.EMBEDDINGS, provider: AiToolProvider.TAVILY, auth: { apiKey: 'key' } }))
            .rejects.toMatchObject({ error: { code: ErrorCode.VALIDATION } })
    })
})

describe('the provider a chat turn is billed under', () => {
    it('is the pinned key\'s provider, not the Default AI key\'s', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const key = await customKey({ ctx, name: 'Team', models: ['team-model'] })

        const provider = await agentHelpers.resolveConversationProviderName({ platformId: ctx.platform.id, projectId: ctx.project.id, providerConfigId: key.id, log: app.log })

        expect(provider).toBe(AIProviderName.CUSTOM)
    })
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, aiProvidersEnabled: true } })
}

async function customKey({ ctx, name, models, projectScope, projectIds }: { ctx: TestContext, name: string, models: string[], projectScope?: 'all' | 'selected' | 'except', projectIds?: string[] }): Promise<{ id: string }> {
    return mockAndSaveAIProvider({
        platformId: ctx.platform.id,
        provider: AIProviderName.CUSTOM,
        displayName: name,
        config: {
            baseUrl: 'https://api.example.com/v1',
            apiKeyHeader: 'Authorization',
            models: models.map((modelId) => ({ modelId, modelName: modelId, modelType: AIProviderModelType.TEXT })),
        },
        ...(projectScope ? { projectScope } : {}),
        ...(projectIds ? { projectIds } : {}),
    })
}

async function createTier({ ctx, entries, name = 'Expert' }: { ctx: TestContext, entries: { configId: string, modelId: string }[], name?: string }): Promise<{ id: string }> {
    const response = await ctx.post('/v1/platform-model-tiers', { name, emoji: '🧠', description: null, entries })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

async function createConversation({ ctx, body }: { ctx: TestContext, body: Record<string, unknown> }): Promise<AgentConversation> {
    const response = await ctx.post(CONVERSATIONS_URL, body)
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function getConfig({ ctx, conversationId, dryRun = true, modelName = null }: { ctx: TestContext, conversationId: string, dryRun?: boolean, modelName?: string | null }): ReturnType<ReturnType<typeof agentRpcHandlers>['getAgentConfig']> {
    return agentRpcHandlers(app.log).getAgentConfig({
        conversationId,
        platformId: ctx.platform.id,
        userId: ctx.user.id,
        userMessage: 'hello',
        modelName,
        dryRun,
    })
}

async function releaseRun({ conversationId }: { conversationId: string }): Promise<void> {
    await db.update('agent_conversation', conversationId, { status: 'IDLE', activeRunId: null })
}

function nonDefaultChatTierId(): string {
    const catalog = modelTierCatalog.current('chat')
    const tier = catalog.tiers.find((candidate) => candidate.id !== catalog.defaultTierId)
    assertNotNullOrUndefined(tier, 'chat tier other than the default')
    return tier.id
}

function curatedOpenAiModel(): string {
    return aiProviderUtils.runnableChatModelIds({ provider: AIProviderName.OPENAI })[0]
}

const CONVERSATIONS_URL = '/v1/agents/conversations'
const EMBEDDING_SOURCE_URL = '/v1/knowledge-base/files/embedding-source'
