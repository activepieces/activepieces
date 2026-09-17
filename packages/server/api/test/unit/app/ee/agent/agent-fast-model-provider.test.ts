import { AIProviderName } from '@activepieces/core-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetChatProvider, mockGetConfigOrThrow } = vi.hoisted(() => ({
    mockGetChatProvider: vi.fn().mockResolvedValue(null),
    mockGetConfigOrThrow: vi.fn(),
}))

vi.mock('../../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({
        getChatProvider: mockGetChatProvider,
        getConfigOrThrow: mockGetConfigOrThrow,
    }),
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    agentAiUtils: { createChatModel: (args: unknown) => args },
}))

const { agentHelpers } = await import('../../../../../src/app/ee/agent/agent-helpers')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never
const platformId = 'platform-1'
const scope = { type: 'project', projectId: 'project-1' } as const

describe('resolveFastModel', () => {
    beforeEach(() => {
        mockGetChatProvider.mockClear().mockResolvedValue(null)
        mockGetConfigOrThrow.mockClear().mockResolvedValue({
            provider: AIProviderName.OPENROUTER,
            configId: 'config-1',
            auth: { apiKey: 'k' },
            config: {},
        })
    })

    it('fills a flow step\'s inputs on the run\'s own provider, so a platform without chat can still run one', async () => {
        const model = await agentHelpers.resolveFastModel({ platformId, provider: AIProviderName.OPENROUTER, scope, log })

        expect(mockGetChatProvider).not.toHaveBeenCalled()
        expect(mockGetConfigOrThrow).toHaveBeenCalledWith({ platformId, provider: AIProviderName.OPENROUTER, scope })
        expect(model).toMatchObject({ provider: AIProviderName.OPENROUTER, modelId: 'anthropic/claude-haiku-4.5' })
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

        expect(model).toMatchObject({ provider: AIProviderName.ANTHROPIC, modelId: 'claude-haiku-4-5' })
    })
})
