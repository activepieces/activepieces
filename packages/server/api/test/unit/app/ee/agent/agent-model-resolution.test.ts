import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it, vi } from 'vitest'
import { agentHelpers } from '../../../../../src/app/ee/agent/agent-helpers'

const getChatProviderName = vi.fn()

vi.mock('../../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({ getChatProviderName }),
}))

const resolve = ({ provider, selectedModel }: { provider: AIProviderName, selectedModel: string | null }) =>
    agentHelpers.resolveModelIdForProvider({ provider, selectedModel })

describe('resolveModelIdForProvider', () => {
    it('keeps the tier model id for the activepieces provider', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'fast' })).toBe('anthropic/claude-haiku-4.5')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'premium' })).toBe('anthropic/claude-opus-4.8')
    })

    it('keeps the tier model id for openrouter', () => {
        expect(resolve({ provider: AIProviderName.OPENROUTER, selectedModel: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
    })

    it('honours a model the provider actually offers', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'gpt-4.1-mini' })).toBe('gpt-4.1-mini')
        expect(resolve({ provider: AIProviderName.GOOGLE, selectedModel: 'gemini-2.5-flash' })).toBe('gemini-2.5-flash')
    })

    it('maps a legacy tier id to the provider equivalent when it ships one', () => {
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'smart' })).toBe('claude-sonnet-4-6')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'fast' })).toBe('claude-haiku-4-5')
    })

    it('falls back to the first curated model when the tier has no provider equivalent', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'smart' })).toBe('gpt-5.5')
        expect(resolve({ provider: AIProviderName.GOOGLE, selectedModel: 'smart' })).toBe('gemini-2.5-pro')
        // the premium tier runs opus 4.8, which the native anthropic list does not carry
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'premium' })).toBe('claude-sonnet-4-6')
    })

    it('never sends another provider stale selection through', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'claude-sonnet-4-6' })).toBe('gpt-5.5')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'gpt-5.5' })).toBe('claude-sonnet-4-6')
    })

    it('defaults to the smart tier when nothing is selected', () => {
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: null })).toBe('claude-sonnet-4-6')
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: null })).toBe('gpt-5.5')
    })

    it('strips the tier vendor prefix for providers that declare no curated models', () => {
        expect(resolve({ provider: AIProviderName.BEDROCK, selectedModel: 'smart' })).toBe('claude-sonnet-4-6')
    })

    it('resolves the fast round to a model the provider offers', () => {
        expect(agentHelpers.resolveFastModelId({ provider: AIProviderName.ANTHROPIC })).toBe('claude-haiku-4-5')
        expect(agentHelpers.resolveFastModelId({ provider: AIProviderName.OPENAI })).toBe('gpt-5.5')
        expect(agentHelpers.resolveFastModelId({ provider: AIProviderName.ACTIVEPIECES })).toBe('anthropic/claude-haiku-4.5')
    })
})

describe('resolveModelIdForAnalytics', () => {
    const forAnalytics = ({ provider, selectedModel }: { provider: AIProviderName | null, selectedModel: string | null }) =>
        agentHelpers.resolveModelIdForAnalytics({ provider, selectedModel })

    it('reports the model the turn ran on when the provider is known', () => {
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: 'gpt-4.1' })).toBe('gpt-4.1')
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: 'smart' })).toBe('gpt-5.5')
    })

    it('reports nothing when no model was ever selected', () => {
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: null })).toBeNull()
        expect(forAnalytics({ provider: null, selectedModel: null })).toBeNull()
    })

    it('falls back to the tier model id when the provider no longer resolves', () => {
        expect(forAnalytics({ provider: null, selectedModel: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
        expect(forAnalytics({ provider: null, selectedModel: 'gpt-4.1-mini' })).toBe('gpt-4.1-mini')
    })

    it('never forwards an unrecognised stored value to the analytics sink', () => {
        expect(forAnalytics({ provider: null, selectedModel: 'totally-made-up-model' })).toBeNull()
        expect(forAnalytics({ provider: null, selectedModel: '<script>alert(1)</script>' })).toBeNull()
    })
})

describe('chatUsageTracker — a flow step is not billed as a chat message', () => {
    it('returns before doing any work, since the flow run meters its own AI usage', async () => {
        const { chatUsageTracker } = await import('../../../../../src/app/ee/agent/chat-usage-tracker')
        const log = { info: () => undefined, warn: () => undefined, error: () => undefined }

        await expect(chatUsageTracker(log as never).track({
            conversation: { id: 'conv-1', source: 'FLOW_STEP', platformId: 'plat-1', modelName: 'anthropic/claude-opus-4.6' } as never,
        })).resolves.toBeUndefined()
    })
})

describe('runScopeOrThrow', () => {
    it('scopes a run to its project', () => {
        expect(agentHelpers.runScopeOrThrow({ projectId: 'proj-1' })).toEqual({ type: 'project', projectId: 'proj-1' })
    })

    it('refuses a run with no project instead of widening to every platform key', () => {
        expect(() => agentHelpers.runScopeOrThrow({ projectId: null })).toThrow()
    })
})

describe('resolveChatProviderName', () => {
    const log = { info: () => undefined, warn: () => undefined, error: () => undefined, debug: () => undefined } as never

    it('reports no provider for a conversation with no project, rather than guessing one platform-wide', async () => {
        await expect(agentHelpers.resolveChatProviderName({ platformId: 'plat-1', projectId: null, log })).resolves.toBeNull()
    })

    it('lets a lookup failure surface, so no caller reads a fault as a platform with no provider', async () => {
        getChatProviderName.mockRejectedValueOnce(new Error('connection terminated'))

        await expect(agentHelpers.resolveChatProviderName({ platformId: 'plat-1', projectId: 'proj-1', log })).rejects.toThrow('connection terminated')
    })

    it('asks only for keys the project may use, never platform-wide', async () => {
        getChatProviderName.mockResolvedValueOnce(AIProviderName.OPENROUTER)

        await agentHelpers.resolveChatProviderName({ platformId: 'plat-1', projectId: 'proj-1', log })

        expect(getChatProviderName).toHaveBeenCalledWith({ platformId: 'plat-1', scope: { type: 'project', projectId: 'proj-1' } })
    })
})
