import { ActivepiecesError, AIProviderName, ErrorCode, tryCatchSync } from '@activepieces/core-utils'
import { ModelTierSurface } from '@activepieces/server-utils'
import { AgentRunSource, AI_PROVIDER_ENTITY_TYPES, AIProviderModelType, aiProviderUtils } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { agentHelpers } from '../../../../../src/app/ee/agent/agent-helpers'
import { agentModelResolution } from '../../../../../src/app/ee/agent/agent-model-resolution'
import { publishedTierReaders } from './model-tier-fixture'

const getChatProviderName = vi.fn()

vi.mock('../../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({ getChatProviderName }),
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    modelTierCatalog: (await import('./model-tier-fixture')).publishedModelTierCatalog,
}))

const warn = vi.fn()
const log = { info: vi.fn(), warn, error: vi.fn(), debug: vi.fn() } as never

const resolve = ({ provider, selectedModel, surface = 'flow' }: { provider: AIProviderName, selectedModel: string | null, surface?: ModelTierSurface }) =>
    agentModelResolution.resolveModelIdForProvider({ provider, selectedModel, surface })

describe('surfaceOf', () => {
    it('sends the sources that name their own model to the flow list and the rest to the chat list', () => {
        expect(agentModelResolution.surfaceOf({ source: AgentRunSource.FLOW_STEP })).toBe('flow')
        expect(agentModelResolution.surfaceOf({ source: AgentRunSource.AGENT })).toBe('flow')
        expect(agentModelResolution.surfaceOf({ source: AgentRunSource.CHAT })).toBe('chat')
        expect(agentModelResolution.surfaceOf({ source: AgentRunSource.AGENT_BUILDER })).toBe('chat')
    })
})

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

        expect(agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.VERTEX, selectedModel: 'smart', surface: 'flow', config })).toBe('claude-3-5-sonnet@20241022')
        expect(agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.VERTEX, selectedModel: 'gemini-2.5-flash', surface: 'flow', config })).toBe('gemini-2.5-flash')
    })

    it('honours the key model allow-list over the curated default', () => {
        const scoped = { modelScope: 'selected' as const, modelIds: ['gemini-2.5-flash'] }

        expect(agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.GOOGLE, selectedModel: 'smart', surface: 'flow', ...scoped })).toBe('gemini-2.5-flash')
        expect(agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.GOOGLE, selectedModel: 'gemini-2.5-pro', surface: 'flow', ...scoped })).toBe('gemini-2.5-flash')
    })

    it('refuses when the allow-list excludes every candidate', () => {
        expect(() => agentModelResolution.resolveModelIdForProvider({
            provider: AIProviderName.GOOGLE,
            selectedModel: 'smart',
            surface: 'flow',
            modelScope: 'selected',
            modelIds: ['a-model-this-provider-does-not-offer'],
        })).toThrow()
    })

    it('refuses a key that lists no text model rather than falling back to one it never offered', () => {
        const imageOnly = vertexConfig([{ modelId: 'imagen-4.0-generate-001', modelType: AIProviderModelType.IMAGE }])

        expect(() => agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.VERTEX, selectedModel: 'smart', surface: 'flow', config: imageOnly })).toThrow()
        expect(() => agentModelResolution.resolveModelIdForProvider({ provider: AIProviderName.VERTEX, selectedModel: 'smart', surface: 'flow', config: vertexConfig([]) })).toThrow()
    })

    it('keeps the published tier model id for the activepieces provider', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'fast' })).toBe('anthropic/claude-haiku-4.5')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'premium' })).toBe('anthropic/claude-opus-4.8')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'deep' })).toBe('anthropic/claude-fable-5.1')
    })

    it('reads the list of the surface it is given, so one tier id can mean two models', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'smart', surface: 'flow' })).toBe('anthropic/claude-sonnet-4.6')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'smart', surface: 'chat' })).toBe('google/gemini-3.7-flash')
    })

    it('treats a tier published on the other list as unknown, so it lands on this surface default', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'turbo', surface: 'chat' })).toBe('openai/gpt-5.5')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'turbo', surface: 'flow' })).toBe('anthropic/claude-sonnet-4.6')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: 'deep', surface: 'chat' })).toBe('google/gemini-3.7-flash')
    })

    it('keeps the tier model id for openrouter', () => {
        expect(resolve({ provider: AIProviderName.OPENROUTER, selectedModel: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
    })

    it('honours a model the provider actually offers', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'gpt-4.1-mini' })).toBe('gpt-4.1-mini')
        expect(resolve({ provider: AIProviderName.GOOGLE, selectedModel: 'gemini-2.5-flash' })).toBe('gemini-2.5-flash')
    })

    it('maps a tier id to the provider equivalent when the tier names one', () => {
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'smart' })).toBe('claude-sonnet-4-6')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'fast' })).toBe('claude-haiku-4-5')
    })

    it('falls back to the first curated model when the tier has no provider equivalent', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'smart' })).toBe('gpt-5.5')
        expect(resolve({ provider: AIProviderName.GOOGLE, selectedModel: 'smart' })).toBe('gemini-3.7-flash')
    })

    it('gives each tier the native model it declares, rather than one derived from its id', () => {
        for (const tier of publishedTierReaders.flow.tiers.filter((candidate) => candidate.nativeModelId)) {
            expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: tier.id }), tier.id).toBe(tier.nativeModelId)
        }
    })

    it('lends a published tier with no native model the native model of the bundled tier with the same id', () => {
        expect(agentModelResolution.nativeModelIdFor({ tier: publishedTierReaders.chat.resolveTier({ tierId: 'smart' }) })).toBe('claude-sonnet-4-6')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'smart', surface: 'chat' })).toBe('claude-sonnet-4-6')
    })

    it('has no native model for a tier the release never shipped, so a curated provider takes its first model', () => {
        expect(agentModelResolution.nativeModelIdFor({ tier: publishedTierReaders.chat.resolveTier({ tierId: 'turbo' }) })).toBeNull()
        expect(resolve({ provider: AIProviderName.GOOGLE, selectedModel: 'turbo', surface: 'chat' })).toBe('gemini-3.7-flash')
    })

    it('never sends another provider stale selection through', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: 'claude-sonnet-4-6' })).toBe('gpt-5.5')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: 'gpt-5.5' })).toBe('claude-sonnet-4-6')
    })

    it('defaults to the surface default tier when nothing is selected', () => {
        expect(resolve({ provider: AIProviderName.ANTHROPIC, selectedModel: null })).toBe('claude-sonnet-4-6')
        expect(resolve({ provider: AIProviderName.OPENAI, selectedModel: null })).toBe('gpt-5.5')
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, selectedModel: null, surface: 'chat' })).toBe('google/gemini-3.7-flash')
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
})

describe('resolveModelIdForAnalytics', () => {
    const forAnalytics = ({ provider, selectedModel, surface = 'chat' }: { provider: AIProviderName | null, selectedModel: string | null, surface?: ModelTierSurface }) =>
        agentModelResolution.resolveModelIdForAnalytics({ provider, selectedModel, surface })

    it('reports the model the turn ran on when the provider is known', () => {
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: 'gpt-4.1' })).toBe('gpt-4.1')
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: 'smart' })).toBe('gpt-5.5')
    })

    it('reports nothing when no model was ever selected', () => {
        expect(forAnalytics({ provider: AIProviderName.OPENAI, selectedModel: null })).toBeNull()
        expect(forAnalytics({ provider: null, selectedModel: null })).toBeNull()
    })

    it('falls back to the tier model id of the surface when the provider no longer resolves', () => {
        expect(forAnalytics({ provider: null, selectedModel: 'smart', surface: 'chat' })).toBe('google/gemini-3.7-flash')
        expect(forAnalytics({ provider: null, selectedModel: 'smart', surface: 'flow' })).toBe('anthropic/claude-sonnet-4.6')
        expect(forAnalytics({ provider: null, selectedModel: 'gpt-4.1-mini' })).toBe('gpt-4.1-mini')
    })

    it('knows a tier id only on its own surface', () => {
        expect(forAnalytics({ provider: null, selectedModel: 'turbo', surface: 'chat' })).toBe('openai/gpt-5.5')
        expect(forAnalytics({ provider: null, selectedModel: 'turbo', surface: 'flow' })).toBeNull()
    })

    it('never forwards an unrecognised stored value to the analytics sink', () => {
        expect(forAnalytics({ provider: null, selectedModel: 'totally-made-up-model' })).toBeNull()
        expect(forAnalytics({ provider: null, selectedModel: '<script>alert(1)</script>' })).toBeNull()
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
    it('picks the default tier model of the surface for a provider we have a catalogue for', () => {
        expect(agentModelResolution.defaultModelIdForProvider({ provider: AIProviderName.ANTHROPIC, surface: 'flow' })).toBe('claude-sonnet-4-6')
        expect(agentModelResolution.defaultModelIdForProvider({ provider: AIProviderName.ACTIVEPIECES, surface: 'flow' })).toBe('anthropic/claude-sonnet-4.6')
        expect(agentModelResolution.defaultModelIdForProvider({ provider: AIProviderName.ACTIVEPIECES, surface: 'chat' })).toBe('google/gemini-3.7-flash')
    })

    it('answers nothing for a provider whose models we do not know, so no invented id is ever stored', () => {
        for (const provider of [AIProviderName.BEDROCK, AIProviderName.AZURE, AIProviderName.XAI]) {
            expect(agentModelResolution.defaultModelIdForProvider({ provider, surface: 'flow' }), provider).toBeNull()
        }
    })
})

describe('resolveRunTier', () => {
    const runTier = ({ provider = AIProviderName.ACTIVEPIECES, modelName, surface = 'flow' }: { provider?: AIProviderName, modelName: string | null, surface?: ModelTierSurface }) =>
        agentModelResolution.resolveRunTier({ provider, modelName, selectedModel: modelName, surface })

    it('gives a run that names a managed tier that tier, so Heavy thinks on its own budget rather than the default one', () => {
        expect(runTier({ modelName: 'premium' })).toMatchObject({ id: 'premium', thinkingBudget: 20_000 })
        expect(runTier({ modelName: 'deep' })).toMatchObject({ id: 'deep', modelId: 'anthropic/claude-fable-5.1' })
    })

    it('keeps the default tier for a concrete model id, a tier the file no longer carries, or no model at all', () => {
        expect(runTier({ modelName: 'anthropic/claude-opus-4.8' }).id).toBe('smart')
        expect(runTier({ modelName: 'tier-9' }).id).toBe('smart')
        expect(runTier({ modelName: null }).id).toBe('smart')
    })

    it('never reads an own-key deployment named like a tier as that tier', () => {
        expect(runTier({ provider: AIProviderName.AZURE, modelName: 'premium' }).id).toBe('smart')
    })

    it('resolves the chat pick on the chat list', () => {
        expect(runTier({ modelName: 'smart', surface: 'chat' }).modelId).toBe('google/gemini-3.7-flash')
        expect(runTier({ modelName: 'turbo', surface: 'chat' }).id).toBe('turbo')
    })
})

describe('resolveNamedModelId', () => {
    beforeEach(() => {
        warn.mockClear()
    })

    const named = ({ provider, modelName, surface = 'flow', ...scope }: { provider: AIProviderName, modelName: string, surface?: ModelTierSurface, modelScope?: 'selected', modelIds?: string[] }) =>
        agentModelResolution.resolveNamedModelId({ provider, modelName, surface, log, ...scope })

    const denialFor = ({ modelName, surface, ...scope }: { modelName: string, surface?: ModelTierSurface, modelScope?: 'selected', modelIds?: string[] }) => {
        const { error } = tryCatchSync(() => named({ provider: AIProviderName.ACTIVEPIECES, modelName, ...(surface ? { surface } : {}), ...scope }))
        return error instanceof ActivepiecesError ? error.error : undefined
    }

    it('lets a managed run name any model on the managed allow-list', () => {
        for (const modelId of aiProviderUtils.managedChatModelIds()) {
            expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: modelId }), modelId).toBe(modelId)
        }
        expect(warn).not.toHaveBeenCalled()
    })

    it('resolves a tier id to that tier model on the surface given, rather than treating it as a model name', () => {
        for (const tier of publishedTierReaders.flow.tiers) {
            expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: tier.id }), tier.id).toBe(tier.modelId)
        }
        expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: 'smart', surface: 'chat' })).toBe('google/gemini-3.7-flash')
        expect(warn).not.toHaveBeenCalled()
    })

    it('accepts a model the release does not ship once a published tier on this surface carries it', () => {
        expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: 'anthropic/claude-fable-5.1', surface: 'flow' })).toBe('anthropic/claude-fable-5.1')
        expect(denialFor({ modelName: 'anthropic/claude-fable-5.1', surface: 'chat' })?.code).toBe(ErrorCode.ENTITY_NOT_FOUND)
    })

    it('runs a tier the file no longer carries on the surface default, and says so once', () => {
        expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: 'premium', surface: 'chat' })).toBe('google/gemini-3.7-flash')
        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn).toHaveBeenCalledWith(expect.objectContaining({ tier: { id: 'premium' }, surface: 'chat' }), expect.stringContaining('no longer published'))

        expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: 'turbo', surface: 'flow' })).toBe('anthropic/claude-sonnet-4.6')
        expect(warn).toHaveBeenCalledTimes(2)
    })

    it('never reads a slashed id as a tier, so a model id is validated and never defaulted', () => {
        expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: 'anthropic/claude-haiku-4.5' })).toBe('anthropic/claude-haiku-4.5')
        expect(denialFor({ modelName: 'openai/gpt-6-astra' })?.code).toBe(ErrorCode.ENTITY_NOT_FOUND)
        expect(warn).not.toHaveBeenCalled()
    })

    it('refuses a model nobody put on the managed allow-list, on our key and our credits', () => {
        for (const modelId of ['google/gemini-3.8-flash', 'openai/gpt-6-astra', 'openai/gpt-6-astra-pro', 'anthropic/claude-fable-6']) {
            const denial = denialFor({ modelName: modelId })
            expect(denial, modelId).toMatchObject({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityType: AI_PROVIDER_ENTITY_TYPES.provider } })
            expect(() => named({ provider: AIProviderName.ACTIVEPIECES, modelName: modelId }), modelId).toThrow(`The model "${modelId}" is not available on Activepieces AI credits`)
        }
    })

    it('refuses an empty or junk model name without mistaking it for a tier', () => {
        for (const modelName of ['', '../../etc/passwd', 'anthropic/claude-haiku-4.5 ']) {
            expect(denialFor({ modelName })?.code, JSON.stringify(modelName)).toBe(ErrorCode.ENTITY_NOT_FOUND)
        }
        expect(warn).not.toHaveBeenCalled()
    })

    it('refuses rather than silently substituting, so a flow never runs a model it did not name', () => {
        const scoped = { modelScope: 'selected' as const, modelIds: ['anthropic/claude-haiku-4.5'] }
        expect(named({ provider: AIProviderName.ACTIVEPIECES, modelName: 'anthropic/claude-haiku-4.5', ...scoped })).toBe('anthropic/claude-haiku-4.5')
        expect(denialFor({ modelName: 'anthropic/claude-sonnet-4.6', ...scoped })?.code).toBe(ErrorCode.ENTITY_NOT_FOUND)
        expect(denialFor({ modelName: 'smart', ...scoped })?.code).toBe(ErrorCode.ENTITY_NOT_FOUND)
    })

    it('leaves a bring-your-own key free to name any model it pays for', () => {
        for (const provider of [AIProviderName.OPENROUTER, AIProviderName.OPENAI, AIProviderName.ANTHROPIC, AIProviderName.CUSTOM]) {
            expect(named({ provider, modelName: 'some-vendor/some-model' }), provider).toBe('some-vendor/some-model')
        }
    })
})
