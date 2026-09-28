import { ActivepiecesError, AIProviderName, ErrorCode, isNil, tryCatchSync, unique } from '@activepieces/core-utils'
import { ModelTier, modelTierCatalog, ModelTierSurface } from '@activepieces/server-utils'
import { ACTIVEPIECES_CHAT_TIERS, AgentRunSource, AI_PROVIDER_ENTITY_TYPES, AiProviderCredentials, AiProviderModelScope, AIProviderModelType, aiProviderUtils } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

function surfaceOf({ source }: { source: AgentRunSource | undefined }): ModelTierSurface {
    return source === AgentRunSource.FLOW_STEP || source === AgentRunSource.AGENT ? 'flow' : 'chat'
}

function findTier({ tierId, surface }: { tierId: string | null, surface: ModelTierSurface }): ModelTier | undefined {
    return isNil(tierId) ? undefined : modelTierCatalog.current(surface).findTier({ tierId })
}

function resolveTier({ tierId, surface }: { tierId: string | null, surface: ModelTierSurface }): ModelTier {
    return modelTierCatalog.current(surface).resolveTier({ tierId })
}

function nativeModelIdFor({ tier }: { tier: ModelTier }): string | null {
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

function managedModelCandidates({ surface, modelScope, modelIds }: { surface: ModelTierSurface, modelScope?: AiProviderModelScope, modelIds?: string[] }): string[] {
    const managed = unique([
        ...aiProviderUtils.managedChatModelIds(),
        ...modelTierCatalog.current(surface).tiers.map((tier) => tier.modelId),
    ])
    return modelScope === 'selected' && !isNil(modelIds) ? managed.filter((id) => modelIds.includes(id)) : managed
}

function isTierId({ modelName }: { modelName: string }): boolean {
    return modelName.length > 0 && !modelName.includes('/')
}

function publishedTierModelId({ tierId, surface, log }: { tierId: string, surface: ModelTierSurface, log: FastifyBaseLogger }): string {
    const tier = findTier({ tierId, surface })
    if (isNil(tier)) {
        log.warn({ tier: { id: tierId }, surface }, '[agentModelResolution] Tier is no longer published; running the surface default')
    }
    return (tier ?? resolveTier({ tierId, surface })).modelId
}

function resolveNamedModelId({ provider, modelName, surface, modelScope, modelIds, log }: { provider: AIProviderName, modelName: string, surface: ModelTierSurface, modelScope?: AiProviderModelScope, modelIds?: string[], log: FastifyBaseLogger }): string {
    if (provider !== AIProviderName.ACTIVEPIECES) {
        return modelName
    }
    const requested = isTierId({ modelName }) ? publishedTierModelId({ tierId: modelName, surface, log }) : modelName
    const candidates = managedModelCandidates({ surface, modelScope, modelIds })
    if (!candidates.includes(requested)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: provider, entityType: AI_PROVIDER_ENTITY_TYPES.provider },
        }, `The model "${modelName}" is not available on Activepieces AI credits. Available models: ${candidates.join(', ')}`)
    }
    return requested
}

function resolveModelIdForProvider({ provider, selectedModel, surface, config, modelScope, modelIds }: { provider: AIProviderName, selectedModel: string | null, surface: ModelTierSurface, config?: AiProviderCredentials['config'], modelScope?: AiProviderModelScope, modelIds?: string[] }): string {
    const catalog = manualTextModelCatalog({ config })
    if (!isNil(catalog)) {
        return pickAllowedModel({ provider, selectedModel, candidates: catalog, modelScope, modelIds })
    }
    const tier = resolveTier({ tierId: selectedModel, surface })
    if (provider === AIProviderName.ACTIVEPIECES || provider === AIProviderName.OPENROUTER) {
        return tier.modelId
    }
    const candidates = (aiProviderUtils.getCuratedChatModels({ provider }) ?? []).map((model) => model.id)
    const preferred = selectedModel && candidates.includes(selectedModel) ? selectedModel : nativeModelIdFor({ tier })
    return pickAllowedModel({ provider, selectedModel: preferred, candidates, modelScope, modelIds })
}

function defaultModelIdForProvider({ provider, surface }: { provider: AIProviderName, surface: ModelTierSurface }): string | null {
    const { data } = tryCatchSync(() => resolveModelIdForProvider({ provider, selectedModel: modelTierCatalog.current(surface).defaultTierId, surface }))
    return data
}

// Analytics and billing report the model a turn ran on. The provider is unknown when a platform's
// chat provider no longer resolves, so fall back to the stored selection — but only when it is one
// of our own ids, never echoing an arbitrary stored string out to the analytics sink.
function resolveModelIdForAnalytics({ provider, selectedModel, surface }: { provider: AIProviderName | null, selectedModel: string | null, surface: ModelTierSurface }): string | null {
    if (isNil(selectedModel)) {
        return null
    }
    if (!isNil(provider)) {
        return resolveModelIdForProvider({ provider, selectedModel, surface })
    }
    const tier = findTier({ tierId: selectedModel, surface })
    if (!isNil(tier)) {
        return tier.modelId
    }
    return aiProviderUtils.isCuratedChatModelId({ modelId: selectedModel }) ? selectedModel : null
}

export const agentModelResolution = {
    surfaceOf,
    findTier,
    resolveTier,
    nativeModelIdFor,
    resolveNamedModelId,
    resolveModelIdForProvider,
    defaultModelIdForProvider,
    resolveModelIdForAnalytics,
}
