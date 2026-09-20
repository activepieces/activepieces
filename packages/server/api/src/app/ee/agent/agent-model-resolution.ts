import { ActivepiecesError, AIProviderName, ErrorCode, isNil, tryCatchSync, unique } from '@activepieces/core-utils'
import { aiPricingCatalog, AiPricingTier } from '@activepieces/server-utils'
import { ACTIVEPIECES_CHAT_TIERS, AI_PROVIDER_ENTITY_TYPES, AiProviderCredentials, AiProviderModelScope, AIProviderModelType, aiProviderUtils } from '@activepieces/shared'

function findTier({ tierId }: { tierId: string | null }) {
    return isNil(tierId) ? undefined : aiPricingCatalog.current().findTierById(tierId)
}

function resolveTier({ tierId }: { tierId: string | null }) {
    return aiPricingCatalog.current().resolveTier(tierId ?? undefined)
}

function nativeModelIdFor({ tier }: { tier: AiPricingTier }): string | null {
    return tier.nativeModelId ?? ACTIVEPIECES_CHAT_TIERS.find((shipped) => shipped.id === tier.id)?.nativeModelId ?? null
}

// An admin-listed catalog is the whole truth about what a key exposes, so an empty one means the key
// serves no text model - not that we may fall back to a curated id it was never configured for.
function manualTextModelCatalog({ config }: { config?: AiProviderCredentials['config'] }): string[] | undefined {
    if (isNil(config) || !('models' in config) || isNil(config.models)) {
        return undefined
    }
    return config.models.filter((model) => model.modelType === AIProviderModelType.TEXT).map((model) => model.modelId)
}

function pickAllowedModel({ provider, selectedModel, candidates, modelScope, modelIds }: { provider: AIProviderName, selectedModel: string | null, candidates: string[], modelScope?: AiProviderModelScope, modelIds?: string[] }): string {
    const allowed = modelScope === 'selected' && !isNil(modelIds)
        ? candidates.filter((candidate) => modelIds.includes(candidate))
        : candidates
    if (allowed.length === 0) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: provider, entityType: AI_PROVIDER_ENTITY_TYPES.provider },
        }, 'this AI provider key allows no text model a chat turn can run on')
    }
    return selectedModel && allowed.includes(selectedModel) ? selectedModel : allowed[0]
}

function managedModelCandidates({ modelScope, modelIds }: { modelScope?: AiProviderModelScope, modelIds?: string[] }): string[] {
    const managed = unique([
        ...aiProviderUtils.managedChatModelIds(),
        ...aiPricingCatalog.current().tiers.map((tier) => tier.modelId),
    ])
    return modelScope === 'selected' && !isNil(modelIds) ? managed.filter((id) => modelIds.includes(id)) : managed
}

function resolveNamedModelId({ provider, modelName, modelScope, modelIds }: { provider: AIProviderName, modelName: string, modelScope?: AiProviderModelScope, modelIds?: string[] }): string {
    if (provider !== AIProviderName.ACTIVEPIECES) {
        return modelName
    }
    const requested = findTier({ tierId: modelName })?.modelId ?? modelName
    const candidates = managedModelCandidates({ modelScope, modelIds })
    if (!candidates.includes(requested)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `The model "${modelName}" is not available on Activepieces AI credits. Available models: ${candidates.join(', ')}` },
        })
    }
    return requested
}

function resolveModelIdForProvider({ provider, selectedModel, config, modelScope, modelIds }: { provider: AIProviderName, selectedModel: string | null, config?: AiProviderCredentials['config'], modelScope?: AiProviderModelScope, modelIds?: string[] }): string {
    const catalog = manualTextModelCatalog({ config })
    if (!isNil(catalog)) {
        return pickAllowedModel({ provider, selectedModel, candidates: catalog, modelScope, modelIds })
    }
    const tier = resolveTier({ tierId: selectedModel })
    if (provider === AIProviderName.ACTIVEPIECES || provider === AIProviderName.OPENROUTER) {
        return tier.modelId
    }
    const candidates = (aiProviderUtils.getCuratedChatModels({ provider }) ?? []).map((model) => model.id)
    const preferred = selectedModel && candidates.includes(selectedModel) ? selectedModel : nativeModelIdFor({ tier })
    return pickAllowedModel({ provider, selectedModel: preferred, candidates, modelScope, modelIds })
}

function defaultModelIdForProvider({ provider }: { provider: AIProviderName }): string | null {
    const { data } = tryCatchSync(() => resolveModelIdForProvider({ provider, selectedModel: aiPricingCatalog.current().defaultTierId }))
    return data
}

// Analytics and billing report the model a turn ran on. The provider is unknown when a platform's
// chat provider no longer resolves, so fall back to the stored selection — but only when it is one
// of our own ids, never echoing an arbitrary stored string out to the analytics sink.
function resolveModelIdForAnalytics({ provider, selectedModel }: { provider: AIProviderName | null, selectedModel: string | null }): string | null {
    if (isNil(selectedModel)) {
        return null
    }
    if (!isNil(provider)) {
        return resolveModelIdForProvider({ provider, selectedModel })
    }
    const tier = findTier({ tierId: selectedModel })
    if (!isNil(tier)) {
        return tier.modelId
    }
    return aiProviderUtils.isCuratedChatModelId({ modelId: selectedModel }) ? selectedModel : null
}

function resolveFastModelId({ provider, config, modelScope, modelIds }: { provider: AIProviderName, config?: AiProviderCredentials['config'], modelScope?: AiProviderModelScope, modelIds?: string[] }): string {
    return resolveModelIdForProvider({ provider, selectedModel: FAST_TIER_ID, config, modelScope, modelIds })
}

export const agentModelResolution = {
    findTier,
    resolveTier,
    resolveNamedModelId,
    resolveModelIdForProvider,
    defaultModelIdForProvider,
    resolveModelIdForAnalytics,
    resolveFastModelId,
}

export const FAST_TIER_ID = 'fast'
