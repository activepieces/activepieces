import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, unique } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, AI_PROVIDER_CAPABILITIES, AI_ROUTING_TIER_IDS, aiProviderUtils, AiRoutingSlot, AiRoutingTierId, AiRoutingTiers, DEFAULT_CHAT_TIER_ID, GetAiRoutingResponse, GetProviderConfigResponse, ResolvedRoutingSlot, UpsertAiRoutingRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { AiModelRoutingEntity, AiModelRoutingSchema } from './ai-model-routing-entity'
import { aiProviderService } from './ai-provider-service'

const FAST_TIER_ID: AiRoutingTierId = 'fast'

const routingRepo = repoFactory<AiModelRoutingSchema>(AiModelRoutingEntity)

export const aiModelRoutingService = (log: FastifyBaseLogger) => ({
    async get({ platformId }: { platformId: string }): Promise<GetAiRoutingResponse> {
        const row = await routingRepo().findOneBy({ platformId })
        if (!isNil(row)) {
            return { tiers: row.tiers, isDefault: false }
        }
        const chatProvider = await aiProviderService(log).getChatProvider({ platformId })
        return { tiers: deriveDefaultTiers({ chatProvider }), isDefault: true }
    },

    async upsert({ platformId, request }: { platformId: string, request: UpsertAiRoutingRequest }): Promise<GetAiRoutingResponse> {
        await validateTiers({ platformId, tiers: request.tiers, log })
        const existing = await routingRepo().findOneBy({ platformId })
        await routingRepo().save({ id: existing?.id ?? apId(), platformId, tiers: request.tiers })
        return { tiers: request.tiers, isDefault: false }
    },

    async resolveChain({ platformId, tierId }: { platformId: string, tierId: AiRoutingTierId }): Promise<ResolvedRoutingSlot[]> {
        const row = await routingRepo().findOneBy({ platformId })
        if (isNil(row)) {
            const chatProvider = await aiProviderService(log).getChatProvider({ platformId })
            if (isNil(chatProvider)) {
                return []
            }
            return [{
                provider: chatProvider.provider,
                modelId: resolveModelIdForProvider({ provider: chatProvider.provider, selectedModel: tierId }),
                auth: chatProvider.auth,
                config: chatProvider.config,
                fastModelId: resolveModelIdForProvider({ provider: chatProvider.provider, selectedModel: FAST_TIER_ID }),
            }]
        }
        const tier = row.tiers[tierId]
        const slots = [tier.main, tier.backup1, tier.backup2]
        const providerConfigs = await fetchProviderConfigs({ platformId, providers: slots.map((slot) => slot.provider), log })
        const fastSlots = [row.tiers.fast.main, row.tiers.fast.backup1, row.tiers.fast.backup2]
        const resolved: ResolvedRoutingSlot[] = []
        for (const slot of slots) {
            const providerConfig = providerConfigs.get(slot.provider)
            if (isNil(providerConfig)) {
                log.warn({ aiRouting: { tier: tierId, provider: slot.provider } }, '[aiModelRouting] skipping slot, provider no longer configured')
                continue
            }
            resolved.push({
                provider: slot.provider,
                modelId: slot.modelId,
                auth: providerConfig.auth,
                config: providerConfig.config,
                fastModelId: fastSlots.find((fastSlot) => fastSlot.provider === slot.provider)?.modelId,
            })
        }
        return resolved
    },
})

function findTier({ tierId }: { tierId: string | null }) {
    return ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === tierId)
}

function resolveTier({ tierId }: { tierId: string | null }) {
    return findTier({ tierId }) ?? findTier({ tierId: DEFAULT_CHAT_TIER_ID }) ?? ACTIVEPIECES_CHAT_TIERS[0]
}

function resolveModelIdForProvider({ provider, selectedModel }: { provider: AIProviderName, selectedModel: string | null }): string {
    const curatedModels = aiProviderUtils.getCuratedChatModels({ provider })
    if (selectedModel && curatedModels?.some((model) => model.id === selectedModel)) {
        return selectedModel
    }
    const tierModelId = resolveTier({ tierId: selectedModel }).modelId
    if (provider === AIProviderName.ACTIVEPIECES || provider === AIProviderName.OPENROUTER) {
        return tierModelId
    }
    const nativeModelId = tierModelId.replace(/^[^/]+\//, '').replace(/\./g, '-')
    if (isNil(curatedModels)) {
        return nativeModelId
    }
    return curatedModels.some((model) => model.id === nativeModelId) ? nativeModelId : curatedModels[0].id
}

function deriveDefaultTiers({ chatProvider }: { chatProvider: GetProviderConfigResponse | null }): AiRoutingTiers {
    const buildTier = (tierId: AiRoutingTierId) => {
        const slot: AiRoutingSlot = isNil(chatProvider)
            ? { provider: AIProviderName.ACTIVEPIECES, modelId: resolveTier({ tierId }).modelId }
            : { provider: chatProvider.provider, modelId: resolveModelIdForProvider({ provider: chatProvider.provider, selectedModel: tierId }) }
        return { main: slot, backup1: slot, backup2: slot }
    }
    return { fast: buildTier('fast'), smart: buildTier('smart'), premium: buildTier('premium') }
}

async function fetchProviderConfigs({ platformId, providers, log }: { platformId: string, providers: AIProviderName[], log: FastifyBaseLogger }): Promise<Map<AIProviderName, GetProviderConfigResponse>> {
    const configs = new Map<AIProviderName, GetProviderConfigResponse>()
    for (const provider of unique(providers)) {
        try {
            configs.set(provider, await aiProviderService(log).getConfigOrThrow({ platformId, provider }))
        }
        catch {
            continue
        }
    }
    return configs
}

async function validateTiers({ platformId, tiers, log }: { platformId: string, tiers: AiRoutingTiers, log: FastifyBaseLogger }): Promise<void> {
    const configuredProviders = new Set((await aiProviderService(log).listProviders(platformId)).map((provider) => provider.provider))
    validateTiersAgainstProviders({ tiers, configuredProviders })
}

function validateTiersAgainstProviders({ tiers, configuredProviders }: { tiers: AiRoutingTiers, configuredProviders: Set<AIProviderName> }): void {
    for (const tierId of AI_ROUTING_TIER_IDS) {
        const tier = tiers[tierId]
        const slots = [tier.main, tier.backup1, tier.backup2]
        for (const slot of slots) {
            if (!configuredProviders.has(slot.provider)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `aiRouting.providerNotConfigured:${tierId}:${slot.provider}` },
                })
            }
        }
        const mainCapabilities = AI_PROVIDER_CAPABILITIES[tier.main.provider]
        for (const backup of [tier.backup1, tier.backup2]) {
            const backupCapabilities = AI_PROVIDER_CAPABILITIES[backup.provider]
            if (mainCapabilities.supportsImageGeneration && !backupCapabilities.supportsImageGeneration) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `aiRouting.capabilityMismatch.imageGeneration:${tierId}:${backup.provider}` },
                })
            }
            if (!isNil(mainCapabilities.webSearch) && isNil(backupCapabilities.webSearch)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `aiRouting.capabilityMismatch.webSearch:${tierId}:${backup.provider}` },
                })
            }
        }
    }
}

export const aiModelRoutingResolution = {
    findTier,
    resolveTier,
    resolveModelIdForProvider,
    deriveDefaultTiers,
    validateTiersAgainstProviders,
}
