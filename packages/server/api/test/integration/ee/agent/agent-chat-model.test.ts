import { AIProviderName, ErrorCode } from '@activepieces/core-utils'
import { aiUtils } from '@activepieces/server-utils'
import { AgentConversation, AIProviderModelType, aiProviderUtils, AiToolCapability, AiToolProvider, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { aiToolConfigService } from '../../../../src/app/ai/ai-tool-config-service'
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

    it('is refused when the key does not serve the chat\'s project', async () => {
        const ctx = await context()
        const key = await customKey({ ctx, name: 'Elsewhere', models: ['team-model'], projectScope: 'selected', projectIds: [] })

        const response = await ctx.post(CONVERSATIONS_URL, { projectId: ctx.project.id, providerConfigId: key.id, modelName: 'team-model' })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
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

    it('pins a tier name to the real model it resolved to, so the next turn runs the same model', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const conversation = await createConversation({ ctx, body: { modelName: 'smart' } })

        const first = await getConfig({ ctx, conversationId: conversation.id, dryRun: false })
        await releaseRun({ conversationId: conversation.id })
        const second = await getConfig({ ctx, conversationId: conversation.id })

        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })
        expect(stored.modelName).toBe(first.modelId)
        expect(second.modelId).toBe(first.modelId)
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

async function createTier({ ctx, entries }: { ctx: TestContext, entries: { configId: string, modelId: string }[] }): Promise<{ id: string }> {
    const response = await ctx.post('/v1/platform-model-tiers', { name: 'Expert', emoji: '🧠', description: null, entries })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

async function createConversation({ ctx, body }: { ctx: TestContext, body: Record<string, unknown> }): Promise<AgentConversation> {
    const response = await ctx.post(CONVERSATIONS_URL, body)
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function getConfig({ ctx, conversationId, dryRun = true }: { ctx: TestContext, conversationId: string, dryRun?: boolean }): ReturnType<ReturnType<typeof agentRpcHandlers>['getAgentConfig']> {
    return agentRpcHandlers(app.log).getAgentConfig({
        conversationId,
        platformId: ctx.platform.id,
        userId: ctx.user.id,
        userMessage: 'hello',
        modelName: null,
        dryRun,
    })
}

async function releaseRun({ conversationId }: { conversationId: string }): Promise<void> {
    await db.update('agent_conversation', conversationId, { status: 'IDLE', activeRunId: null })
}

function curatedOpenAiModel(): string {
    return aiProviderUtils.runnableChatModelIds({ provider: AIProviderName.OPENAI })[0]
}

const CONVERSATIONS_URL = '/v1/agents/conversations'
