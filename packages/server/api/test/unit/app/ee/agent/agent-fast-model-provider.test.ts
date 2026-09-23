import { AIProviderName } from '@activepieces/core-utils'
import { AIProviderModelType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetChatProvider, mockGetConfigOrThrow, mockListModels } = vi.hoisted(() => ({
    mockGetChatProvider: vi.fn().mockResolvedValue(null),
    mockGetConfigOrThrow: vi.fn(),
    mockListModels: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({
        getChatProvider: mockGetChatProvider,
        getConfigOrThrow: mockGetConfigOrThrow,
        listModels: mockListModels,
    }),
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    aiUtils: { createModel: (args: unknown) => args },
}))

const { agentHelpers } = await import('../../../../../src/app/ee/agent/agent-helpers')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never
const platformId = 'platform-1'
const scope = { type: 'project', projectId: 'project-1' } as const

describe('resolveFastModel', () => {
    beforeEach(() => {
        mockListModels.mockClear().mockResolvedValue([])
        mockGetChatProvider.mockClear().mockResolvedValue(null)
        mockGetConfigOrThrow.mockClear().mockResolvedValue({
            provider: AIProviderName.OPENROUTER,
            configId: 'config-1',
            auth: { apiKey: 'k' },
            config: {},
            modelScope: 'all',
            modelIds: [],
        })
    })

    it('fills a flow step\'s inputs on the run\'s own provider, so a platform without chat can still run one', async () => {
        const model = await agentHelpers.resolveFastModel({ platformId, provider: AIProviderName.OPENROUTER, scope, log })

        expect(mockGetChatProvider).not.toHaveBeenCalled()
        expect(mockGetConfigOrThrow).toHaveBeenCalledWith({ platformId, provider: AIProviderName.OPENROUTER, scope })
        expect(model).toMatchObject({ credentials: { provider: AIProviderName.OPENROUTER }, modelId: 'anthropic/claude-haiku-4.5' })
    })

    it('asks for the pinned key when the run names one', async () => {
        await agentHelpers.resolveFastModel({ platformId, provider: AIProviderName.OPENROUTER, providerConfigId: 'config-2', scope, log })

        expect(mockGetConfigOrThrow).toHaveBeenCalledWith({ platformId, provider: AIProviderName.OPENROUTER, scope, configId: 'config-2' })
    })

    it('still refuses when no provider is named and the platform has no chat provider', async () => {
        await expect(agentHelpers.resolveFastModel({ platformId, scope, log })).rejects.toMatchObject({
            error: { code: 'ENTITY_NOT_FOUND', params: { entityType: 'ChatAiProvider' } },
        })
    })

    it('uses the chat provider when no provider is named and one is configured', async () => {
        mockGetChatProvider.mockResolvedValue({ provider: AIProviderName.ANTHROPIC, auth: { apiKey: 'k' }, config: {} })

        const model = await agentHelpers.resolveFastModel({ platformId, scope, log })

        expect(model).toMatchObject({ credentials: { provider: AIProviderName.ANTHROPIC }, modelId: 'claude-haiku-4-5' })
    })

    describe('on a provider we ship no curated model list for', () => {
        beforeEach(() => {
            mockGetConfigOrThrow.mockResolvedValue({
                provider: AIProviderName.BEDROCK,
                configId: 'config-1',
                auth: { accessKeyId: 'a', secretAccessKey: 's' },
                config: { region: 'us-east-1' },
                modelScope: 'all',
                modelIds: [],
            })
        })

        it('fills a configured action\'s inputs on a fast model the key actually serves', async () => {
            mockListModels.mockResolvedValue([
                { id: 'amazon.titan-text-express-v1', name: 'Titan', type: AIProviderModelType.TEXT },
                { id: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0', name: 'Haiku', type: AIProviderModelType.TEXT },
            ])

            const model = await agentHelpers.resolveFastModel({ platformId, provider: AIProviderName.BEDROCK, scope, log })

            expect(model).toMatchObject({ credentials: { provider: AIProviderName.BEDROCK }, modelId: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0' })
        })

        it('needs nothing from the worker, so an in-flight run on an older one still resolves', async () => {
            mockListModels.mockResolvedValue([{ id: 'amazon.titan-text-express-v1', name: 'Titan', type: AIProviderModelType.TEXT }])

            await expect(agentHelpers.resolveFastModel({ platformId, provider: AIProviderName.BEDROCK, scope, log })).resolves.toMatchObject({ modelId: 'amazon.titan-text-express-v1' })
        })

        it('still refuses a key that serves no text model at all', async () => {
            mockListModels.mockResolvedValue([])

            await expect(agentHelpers.resolveFastModel({ platformId, provider: AIProviderName.BEDROCK, scope, log })).rejects.toMatchObject({
                error: { code: 'ENTITY_NOT_FOUND' },
            })
        })
    })

    it('never asks the provider when our own catalogue already names a fast model', async () => {
        const model = await agentHelpers.resolveFastModel({ platformId, provider: AIProviderName.OPENROUTER, scope, log })

        expect(model).toMatchObject({ modelId: 'anthropic/claude-haiku-4.5' })
        expect(mockListModels).not.toHaveBeenCalled()
    })
})

describe('resolveModelId', () => {
    const bedrockKey = { provider: AIProviderName.BEDROCK, configId: 'config-1', auth: { accessKeyId: 'a', secretAccessKey: 's' }, config: { region: 'us-east-1' }, modelScope: 'all' as const, modelIds: [] }
    const text = (id: string) => ({ id, name: id, type: AIProviderModelType.TEXT })

    const resolve = ({ selectedModel }: { selectedModel: string | null }) =>
        agentHelpers.resolveModelId({ platformId, providerConfig: bedrockKey, selectedModel, scope, log })

    beforeEach(() => {
        mockListModels.mockClear().mockResolvedValue([])
    })

    it('never asks the provider when our own catalogue already answers', async () => {
        const anthropicKey = { ...bedrockKey, provider: AIProviderName.ANTHROPIC, config: {} }

        await expect(agentHelpers.resolveModelId({ platformId, providerConfig: anthropicKey, selectedModel: 'smart', scope, log })).resolves.toBe('claude-sonnet-4-6')
        expect(mockListModels).not.toHaveBeenCalled()
    })

    it('runs a chat tier on a model the key actually serves', async () => {
        mockListModels.mockResolvedValue([text('amazon.titan-text-express-v1')])

        await expect(resolve({ selectedModel: 'smart' })).resolves.toBe('amazon.titan-text-express-v1')
        expect(mockListModels).toHaveBeenCalledWith({ platformId, provider: AIProviderName.BEDROCK, scope, configId: 'config-1' })
    })

    it('keeps the tier meaningful when the provider hosts the model that tier names', async () => {
        mockListModels.mockResolvedValue([
            text('amazon.titan-text-express-v1'),
            text('global.anthropic.claude-haiku-4-5-20251001-v1:0'),
            text('global.anthropic.claude-sonnet-4-6-20250101-v1:0'),
        ])

        await expect(resolve({ selectedModel: 'fast' })).resolves.toBe('global.anthropic.claude-haiku-4-5-20251001-v1:0')
        await expect(resolve({ selectedModel: 'smart' })).resolves.toBe('global.anthropic.claude-sonnet-4-6-20250101-v1:0')
    })

    it('honours a model the user picked over the tier default', async () => {
        mockListModels.mockResolvedValue([text('amazon.titan-text-express-v1'), text('mistral.mistral-large-2407-v1:0')])

        await expect(resolve({ selectedModel: 'mistral.mistral-large-2407-v1:0' })).resolves.toBe('mistral.mistral-large-2407-v1:0')
    })

    it('keeps the run on the model it already resolved rather than picking a second unverified one', async () => {
        mockListModels.mockResolvedValue([
            { id: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0', name: 'Haiku', type: AIProviderModelType.TEXT },
        ])

        await expect(agentHelpers.resolveFastModelId({ platformId, providerConfig: bedrockKey, scope, fallbackModelId: 'eu.anthropic.claude-sonnet-4-6', log })).resolves.toBe('eu.anthropic.claude-sonnet-4-6')
        expect(mockListModels).not.toHaveBeenCalled()
    })

    it('refuses a borrowed model the admin has since scoped off the key', async () => {
        const scopedKey = { ...bedrockKey, modelScope: 'selected' as const, modelIds: ['eu.anthropic.claude-haiku-4-5-20251001-v1:0'] }
        mockListModels.mockResolvedValue([
            { id: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0', name: 'Haiku', type: AIProviderModelType.TEXT },
        ])

        await expect(agentHelpers.resolveFastModelId({ platformId, providerConfig: scopedKey, scope, fallbackModelId: 'eu.anthropic.claude-sonnet-4-6', log }))
            .resolves.toBe('eu.anthropic.claude-haiku-4-5-20251001-v1:0')
    })

    it('never answers with a model the key does not serve', async () => {
        mockListModels.mockResolvedValue([{ id: 'amazon.titan-image-generator-v1', name: 'Titan Image', type: AIProviderModelType.IMAGE }])

        await expect(resolve({ selectedModel: 'smart' })).rejects.toMatchObject({ error: { code: 'ENTITY_NOT_FOUND' } })
    })
})
