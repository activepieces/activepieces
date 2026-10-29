import { AIProviderName } from '@activepieces/core-utils'
import { modelCatalog } from '@activepieces/server-utils'
import { AIProviderModelType, ModelOptions, PlatformModelTier } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { aiProviders } from '../../../../src/app/ai/providers'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
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
    vi.restoreAllMocks()
    ctx = await createTestContext(app!)
})

describe('GET /v1/ai-providers/model-options', () => {
    it('hides a tier whose main key does not serve the project and drops fallbacks that cannot run there', async () => {
        const open = await seedKey({ name: 'Open', models: ['main', 'fallback'] })
        const away = await seedKey({ name: 'Away', models: ['main', 'fallback'], projectScope: 'except', projectIds: [ctx.project.id] })
        const shown = await createTier({ name: 'Shown', entries: [{ configId: open.id, modelId: 'main' }, { configId: away.id, modelId: 'fallback' }, { configId: open.id, modelId: 'fallback' }] })
        await createTier({ name: 'Hidden', entries: [{ configId: away.id, modelId: 'main' }] })

        const options = await listOptions({ surface: 'flow' })

        expect(options.tiers.map((tier) => tier.id)).toEqual([shown.id])
        expect(options.tiers[0].main).toMatchObject({ modelId: 'main', keyName: 'Open', name: 'main' })
        expect(options.tiers[0].fallbacks.map((fallback) => fallback.keyName)).toEqual(['Open'])
        expect(options.keys.map((key) => key.providerConfigId)).toEqual([open.id])
    })

    it('hides a tier whose main model cannot call tools on agent surfaces only', async () => {
        const key = await seedKey({ name: 'Key', models: ['no-tools', 'tools'] })
        const tier = await createTier({ name: 'Plain', entries: [{ configId: key.id, modelId: 'no-tools' }, { configId: key.id, modelId: 'tools' }] })
        mockCatalogWithoutToolsFor({ modelId: 'no-tools' })

        const flow = await listOptions({ surface: 'flow' })
        const agent = await listOptions({ surface: 'agent' })

        expect(flow.tiers.map((option) => option.id)).toEqual([tier.id])
        expect(agent.tiers).toEqual([])
        expect(agent.keys[0].models.map((model) => model.id)).toEqual(['tools'])
    })

    it('lists only the models the key allows and returns no keys when specific models are hidden', async () => {
        const key = await seedKey({ name: 'Key', models: ['allowed', 'blocked'] })
        await databaseConnection().getRepository('ai_provider').update({ id: key.id }, { modelScope: 'selected', modelIds: ['allowed'] })
        const tier = await createTier({ name: 'Expert', entries: [{ configId: key.id, modelId: 'allowed' }] })

        const visible = await listOptions({ surface: 'flow' })
        expect(visible.keys[0].models.map((model) => model.id)).toEqual(['allowed'])

        await databaseConnection().getRepository('platform_configuration').update({ platformId: ctx.platform.id }, { aiSpecificModelsVisible: false })
        const hidden = await listOptions({ surface: 'flow' })

        expect(hidden.keys).toEqual([])
        expect(hidden.specificModelsHidden).toBe(true)
        expect(hidden.tiers.map((option) => option.id)).toEqual([tier.id])
    })

    it('skips a key whose models cannot be loaded and still answers', async () => {
        const broken = await seedKey({ name: 'Broken', models: ['x'] })
        const working = await seedKey({ name: 'Working', models: ['y'] })
        await databaseConnection().getRepository('ai_provider').update({ id: broken.id }, { auth: { iv: 'bad', data: 'bad' } })

        const options = await listOptions({ surface: 'flow' })

        expect(options.keys.map((key) => key.providerConfigId)).toEqual([working.id])
    })

    it('maps a deleted tier to its live replacement', async () => {
        const key = await seedKey({ name: 'Key', models: ['a', 'b'] })
        const old = await createTier({ name: 'Old', entries: [{ configId: key.id, modelId: 'a' }] })
        const replacement = await createTier({ name: 'New', entries: [{ configId: key.id, modelId: 'b' }] })
        await ctx.delete(`${TIERS}/${old.id}`, { replacedBy: replacement.id })

        expect((await listOptions({ surface: 'flow', tierId: old.id })).movedTiers).toEqual({ [old.id]: replacement.id })
        expect((await listOptions({ surface: 'flow', tierId: replacement.id })).movedTiers).toEqual({})
        expect((await listOptions({ surface: 'flow' })).movedTiers).toEqual({})
    })

    it('offers chat only the typed-in models of a key with a manual model list', async () => {
        await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.VERTEX,
            displayName: 'Vertex',
            config: { project: 'acme', region: 'us-central1', models: [{ modelId: 'gemini-2.5-flash', modelName: 'Gemini 2.5 Flash', modelType: AIProviderModelType.TEXT }] },
        })

        const options = await listOptions({ surface: 'chat' })

        expect(options.keys.flatMap((key) => key.models.map((model) => model.id))).toEqual(['gemini-2.5-flash'])
    })

    it('offers chat known chat models and catalog-confirmed tool models in the key\'s own order', async () => {
        vi.spyOn(aiProviders[AIProviderName.OPENAI], 'listModels').mockResolvedValue([
            { id: 'gpt-4o', name: 'GPT-4o', type: AIProviderModelType.TEXT },
            { id: 'no-tools', name: 'No tools', type: AIProviderModelType.TEXT },
            { id: 'gpt-5.5', name: 'GPT-5.5', type: AIProviderModelType.TEXT },
            { id: 'gpt-4o-2024-05-13', name: 'Dated snapshot', type: AIProviderModelType.TEXT },
        ])
        vi.spyOn(modelCatalog, 'load').mockResolvedValue({
            lookup: (model) => model.modelId === 'no-tools' ? { supportsToolCalling: false } : model.modelId === 'gpt-4o' ? { supportsToolCalling: true } : undefined,
        })
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, displayName: 'OpenAI' })

        const chat = (await listOptions({ surface: 'chat' })).keys[0].models.map((model) => model.id)
        const agent = (await listOptions({ surface: 'agent' })).keys[0].models.map((model) => model.id)

        expect(chat).toEqual(['gpt-4o', 'gpt-5.5'])
        expect(agent).toEqual(['gpt-4o', 'gpt-5.5', 'gpt-4o-2024-05-13'])
    })

    it('starts new chats on the platform default chat model, and falls back where its key does not serve the project', async () => {
        const key = await seedKey({ name: 'Key', models: ['first', 'second'] })
        const away = await seedKey({ name: 'Away', models: ['elsewhere'], projectScope: 'except', projectIds: [ctx.project.id] })
        await setDefaultChatModel({ provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'second' })
        expect((await listOptions({ surface: 'chat' })).defaultChoice).toEqual({ type: 'model', provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'second' })

        await setDefaultChatModel({ provider: AIProviderName.CUSTOM, providerConfigId: away.id, modelId: 'elsewhere' })
        expect((await listOptions({ surface: 'chat' })).defaultChoice).not.toMatchObject({ providerConfigId: away.id })
    })

    it('moves the Default AI key when the default tier\'s main key changes', async () => {
        const first = await seedKey({ name: 'First', models: ['m'] })
        const second = await seedKey({ name: 'Second', models: ['m'] })
        const tier = await createTier({ name: 'Chat', entries: [{ configId: first.id, modelId: 'm' }] })
        expect((await ctx.post('/v1/platform-configurations', { defaultChatModel: { type: 'tier', tierId: tier.id } })).statusCode).toBe(StatusCodes.OK)

        await ctx.post(`${TIERS}/${tier.id}`, { entries: [{ configId: second.id, modelId: 'm' }] })

        const keys = await databaseConnection().getRepository('ai_provider').findBy({ platformId: ctx.platform.id })
        expect(keys.filter((key) => key.enabledForChat).map((key) => key.id)).toEqual([second.id])
    })

    it('keeps an own-key default chat model when specific models are hidden from builders', async () => {
        const key = await seedKey({ name: 'Key', models: ['first', 'second'] })
        await createTier({ name: 'Tier', entries: [{ configId: key.id, modelId: 'first' }] })
        expect((await ctx.post('/v1/platform-configurations', { defaultChatModel: { type: 'model', provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'second' } })).statusCode).toBe(StatusCodes.OK)
        expect((await ctx.post('/v1/platform-configurations', { aiSpecificModelsVisible: false })).statusCode).toBe(StatusCodes.OK)

        const chat = await listOptions({ surface: 'chat' })
        const admin = (await ctx.get('/v1/ai-providers/model-options/platform', { surface: 'chat' })).json() as ModelOptions

        expect(chat.keys.flatMap((option) => option.models.map((model) => model.id))).toEqual(['second'])
        expect(chat.defaultChoice).toMatchObject({ providerConfigId: key.id, modelId: 'second' })
        expect(admin.keys.flatMap((option) => option.models.map((model) => model.id))).toEqual(['first', 'second'])
    })

    it('lists every key for the admin picker, including ones limited to other projects, and only for admins', async () => {
        const away = await seedKey({ name: 'Away', models: ['elsewhere'], projectScope: 'except', projectIds: [ctx.project.id] })

        const response = await ctx.get('/v1/ai-providers/model-options/platform', { surface: 'chat' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect((response.json() as ModelOptions).keys.map((key) => key.providerConfigId)).toContain(away.id)
    })

    it('defaults to the Default tier, else credits, else the first option', async () => {
        const key = await seedKey({ name: 'Key', models: ['first', 'second'] })
        expect((await listOptions({ surface: 'flow' })).defaultChoice).toEqual({ type: 'model', provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'first' })

        const first = await createTier({ name: 'First', entries: [{ configId: key.id, modelId: 'first' }] })
        const second = await createTier({ name: 'Second', entries: [{ configId: key.id, modelId: 'second' }] })
        expect((await listOptions({ surface: 'flow' })).defaultChoice).toEqual({ type: 'tier', tierId: first.id })

        await ctx.post(`${TIERS}/${second.id}`, { isDefault: true })
        expect((await listOptions({ surface: 'flow' })).defaultChoice).toEqual({ type: 'tier', tierId: second.id })
    })

    it('shows credits when the managed provider is visible and prefers them over the first option', async () => {
        process.env.AP_OPENROUTER_PROVISION_KEY = 'test-provision-key'
        try {
            const managed = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.ACTIVEPIECES, displayName: 'Activepieces' })
            await seedKey({ name: 'Key', models: ['first'] })

            const options = await listOptions({ surface: 'chat' })

            expect(options.credits?.providerConfigId).toBe(managed.id)
            expect(options.credits?.tiers.length).toBeGreaterThan(0)
            expect(options.defaultChoice).toEqual({ type: 'model', provider: AIProviderName.ACTIVEPIECES, providerConfigId: managed.id, modelId: options.credits?.defaultTierId })
        }
        finally {
            delete process.env.AP_OPENROUTER_PROVISION_KEY
        }
    })
})

async function listOptions({ surface, tierId }: { surface: 'flow' | 'agent' | 'chat', tierId?: string }): Promise<ModelOptions> {
    const response = await ctx.get('/v1/ai-providers/model-options', { projectId: ctx.project.id, surface, ...(tierId ? { tierId } : {}) })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

async function seedKey({ name, models, projectScope, projectIds }: { name: string, models: string[], projectScope?: 'all' | 'selected' | 'except', projectIds?: string[] }): Promise<{ id: string }> {
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

async function createTier({ name, entries }: { name: string, entries: { configId: string, modelId: string }[] }): Promise<PlatformModelTier> {
    const response = await ctx.post(TIERS, { name, emoji: '⚡', description: null, entries })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

function mockCatalogWithoutToolsFor({ modelId }: { modelId: string }): void {
    vi.spyOn(modelCatalog, 'load').mockResolvedValue({
        lookup: (model) => model.modelId === modelId ? { supportsToolCalling: false } : undefined,
    })
}

async function setDefaultChatModel({ provider, providerConfigId, modelId }: { provider: AIProviderName, providerConfigId: string, modelId: string }): Promise<void> {
    await ctx.get('/v1/platform-configurations')
    await databaseConnection().getRepository('platform_configuration').update({ platformId: ctx.platform.id }, { defaultChatModel: { type: 'model', provider, providerConfigId, modelId } })
}

const TIERS = '/v1/platform-model-tiers'
