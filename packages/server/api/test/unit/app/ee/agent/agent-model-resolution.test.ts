import { ActivepiecesError, AIProviderName, ErrorCode, tryCatchSync } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, AIProviderModelType, aiProviderUtils } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { agentHelpers } from '../../../../../src/app/ee/agent/agent-helpers'
import { agentModelResolution } from '../../../../../src/app/ee/agent/agent-model-resolution'

const getChatProviderName = vi.fn()

vi.mock('../../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({ getChatProviderName }),
}))

const resolve = ({ provider, selectedModel }: { provider: AIProviderName, selectedModel: string | null }) =>
    agentModelResolution.resolveModelIdForProvider({ provider, selectedModel })

describe('resolveModelIdForProvider', () => {
    const vertexConfig = (models: { modelId: string, modelType: AIProviderModelType }[]) => ({
        project: 'gcp-project',
        region: 'europe-west4',
        models: models.map((model) => ({ ...model, modelName: model.modelId })),
    })

    it('picks from the models an admin listed on the key, not the curated list', () => {
        const config = vertexConfig([
            { modelId: 'claude-3-5-sonnet@20241022', modelType: AIProviderModelType.TEXT },
            { modelId: 'gemini-2.5-flash', modelType: AIProviderModelType.TEXT },
        ])

        expect(agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.VERTEX, selectedModel: 'smart', config })).toBe('claude-3-5-sonnet@20241022')
        expect(agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.VERTEX, selectedModel: 'gemini-2.5-flash', config })).toBe('gemini-2.5-flash')
    })

    it('honours the key model allow-list over the curated default', () => {
        const scoped = { modelScope: 'selected' as const, modelIds: ['gemini-2.5-flash'] }

        expect(agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.GOOGLE, selectedModel: 'smart', ...scoped })).toBe('gemini-2.5-flash')
        expect(agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.GOOGLE, selectedModel: 'gemini-2.5-pro', ...scoped })).toBe('gemini-2.5-flash')
    })

    it('refuses when the allow-list excludes every candidate', () => {
        expect(() => agentModelResolution.resolveModelIdForProvider({
            provider: AIProviderName.GOOGLE,
            selectedModel: 'smart',
            modelScope: 'selected',
            modelIds: ['a-model-this-provider-does-not-offer'],
        })).toThrow()
    })

    it('refuses a key that lists no text model rather than falling back to one it never offered', () => {
        const imageOnly = vertexConfig([{ modelId: 'imagen-4.0-generate-001', modelType: AIProviderModelType.IMAGE }])

        expect(() => agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.VERTEX, selectedModel: 'smart', config: imageOnly })).toThrow()
        expect(() => agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.VERTEX, selectedModel: 'smart', config: vertexConfig([]) })).toThrow()
    })

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
    })

    it('gives each tier the native model it declares, rather than one derived from its id', () => {
        for (const tier of ACTIVEPIECES_CHAT_TIERS) {
            expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: tier.id }), tier.id).toBe(tier.nativeModelId)
        }
    })

    it('never sends another provider stale selection through', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'claude-sonnet-4-6' })).toBe('gpt-5.5')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'gpt-5.5' })).toBe('claude-sonnet-4-6')
    })

    it('defaults to the smart tier when nothing is selected', () => {
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: null })).toBe('claude-sonnet-4-6')
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: null })).toBe('gpt-5.5')
    })

    it('refuses rather than inventing a model id for a provider whose models we do not know', () => {
        for (const provider of [AIProviderName.BEDROCK, AIProviderName.AZURE, AIProviderName.XAI, AIProviderName.MISTRAL, AIProviderName.DEEPSEEK, AIProviderName.MOONSHOT]) {
            expect(() => resolve({ provider, selectedModel: 'smart' }), provider).toThrow(ActivepiecesError)
        }
    })

    it('never answers a catalogue-less provider with an Anthropic model name', () => {
        const { error } = tryCatchSync(() => resolve({ provider: AIProviderName.BEDROCK, selectedModel: 'smart' }))

        expect(error).toBeInstanceOf(ActivepiecesError)
        expect(String(error)).not.toContain('claude')
    })

    it('resolves the fast round to a model the provider offers', () => {
        expect(agentModelResolution.resolveFastModelId({ provider: AIProviderName.ANTHROPIC })).toBe('claude-haiku-4-5')
        expect(agentModelResolution.resolveFastModelId({ provider: AIProviderName.OPENAI })).toBe('gpt-5.5')
        expect(agentModelResolution.resolveFastModelId({ provider: AIProviderName.ACTIVEPIECES })).toBe('anthropic/claude-haiku-4.5')
    })
})

describe('resolveModelIdForAnalytics', () => {
    const forAnalytics = ({ provider, selectedModel }: { provider: AIProviderName | null, selectedModel: string | null }) =>
        agentModelResolution.resolveModelIdForAnalytics({ provider, selectedModel })

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
        expect(() => agentHelpers.runScopeOrThrow({ projectId: null })).toThrow(ActivepiecesError)
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

describe('defaultModelIdForProvider', () => {
    it('picks the default tier model for a provider we have a catalogue for', () => {
        expect(agentModelResolution.defaultModelIdForProvider({ provider: AIProviderName.ANTHROPIC })).toBe('claude-sonnet-4-6')
        expect(agentModelResolution.defaultModelIdForProvider({ provider: AIProviderName.ACTIVEPIECES })).toBe('anthropic/claude-sonnet-4.6')
    })

    it('answers nothing for a provider whose models we do not know, so no invented id is ever stored', () => {
        for (const provider of [AIProviderName.BEDROCK, AIProviderName.AZURE, AIProviderName.XAI]) {
            expect(agentModelResolution.defaultModelIdForProvider({ provider }), provider).toBeNull()
        }
    })
})

describe('resolveNamedModelId', () => {
    const named = ({ provider, modelName, ...scope }: { provider: AIProviderName, modelName: string, modelScope?: 'selected', modelIds?: string[] }) =>
        agentModelResolution.resolveNamedModelId({ provider, modelName, ...scope })

    const denialFor = ({ modelName, ...scope }: { modelName: string, modelScope?: 'selected', modelIds?: string[] }) => {
        const { error } = tryCatchSync(() => named({ provider: AIProviderName.ACTIVEPIECES, modelName, ...scope }))
        return error instanceof ActivepiecesError ? error.error : undefined
    }

    it('lets a managed run name any model on the managed allow-list', () => {
        for (const modelId of aiProviderUtils.managedChatModelIds()) {
            expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: modelId }), modelId).toBe(modelId)
        }
    })

    it('resolves a tier id to that tier model rather than treating it as a model name', () => {
        for (const tier of ACTIVEPIECES_CHAT_TIERS) {
            expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: tier.id }), tier.id).toBe(tier.modelId)
        }
    })

    it('refuses a model nobody put on the managed allow-list, on our key and our credits', () => {
        for (const modelId of ['google/gemini-3.8-flash', 'openai/gpt-6-astra', 'openai/gpt-6-astra-pro', 'anthropic/claude-fable-5.1']) {
            const denial = denialFor({ modelName: modelId })
            expect(denial?.code, modelId).toBe(ErrorCode.VALIDATION)
            expect(denial?.params, modelId).toMatchObject({ message: expect.stringContaining('not available on Activepieces AI credits') })
        }
    })

    it('refuses an empty or junk model name', () => {
        for (const modelName of ['', '../../etc/passwd', 'anthropic/claude-haiku-4.5 ']) {
            expect(denialFor({ modelName })?.code, JSON.stringify(modelName)).toBe(ErrorCode.VALIDATION)
        }
    })

    it('refuses rather than silently substituting, so a flow never runs a model it did not name', () => {
        const scoped = { modelScope: 'selected' as const, modelIds: ['anthropic/claude-haiku-4.5'] }
        expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: 'anthropic/claude-haiku-4.5', ...scoped })).toBe('anthropic/claude-haiku-4.5')
        expect(denialFor({ modelName: 'anthropic/claude-sonnet-4.6', ...scoped })?.code).toBe(ErrorCode.VALIDATION)
    })

    it('leaves a bring-your-own key free to name any model it pays for', () => {
        for (const provider of [AIProviderName.OPENROUTER, AIProviderName.OPENAI, AIProviderName.ANTHROPIC, AIProviderName.CUSTOM]) {
            expect(named({ provider, modelName: 'some-vendor/some-model' }), provider).toBe('some-vendor/some-model')
        }
    })
})
