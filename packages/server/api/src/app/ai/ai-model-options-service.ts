import { AIProviderName, isNil, PlatformId, spreadIfDefined } from '@activepieces/core-utils'
import { modelCatalog, modelTierCatalog } from '@activepieces/server-utils'
import { AIProviderModel, AIProviderModelType, aiProviderUtils, ModelChoice, ModelOptions, ModelOptionsCredits, ModelOptionsKey, ModelOptionsSurface, ModelOptionsTier, OptionModel } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformConfigurationService } from '../platform/platform-configuration.service'
import { aiKeyScope } from './ai-key-scope'
import { AIProviderSchema } from './ai-provider-entity'
import { aiProviderService, ProjectKeyModels } from './ai-provider-service'
import { platformModelTierService, TierForRun } from './platform-model-tier-service'

export const aiModelOptionsService = (log: FastifyBaseLogger) => ({
    async list({ platformId, projectId, surface, tierId }: { platformId: PlatformId, projectId: string, surface: ModelOptionsSurface, tierId?: string }): Promise<ModelOptions> {
        const [keys, tiersForRun, movedTiers, configuration, catalog] = await Promise.all([
            aiProviderService(log).listKeysForProject({ platformId, projectId }),
            platformModelTierService.listForPicker({ platformId, scope: { type: 'project', projectId } }),
            platformModelTierService.movedTiers({ platformId, tierId }),
            platformConfigurationService(log).getOrCreateForPlatform({ platformId }),
            modelCatalog.load(),
        ])
        const lookup: Lookup = ({ provider, modelId }) => catalog.lookup({ provider, modelId })
        const callsTools: CallsTools = ({ provider, modelId }) => surface === 'flow' || lookup({ provider, modelId })?.supportsToolCalling !== false
        const tiers = tiersForRun.flatMap((forRun) => toTierOption({ forRun, keys, lookup, callsTools }))
        const creditsKey = keys.find((key) => key.row.provider === AIProviderName.ACTIVEPIECES)
        const credits = isNil(creditsKey) ? null : toCredits({ row: creditsKey.row, surface, lookup })
        const specificModelsHidden = !configuration.aiSpecificModelsVisible
        const keyOptions = specificModelsHidden ? [] : keys.flatMap((key) => toKeyOption({ key, surface, lookup, callsTools }))
        const chatKeyId = keys.find((key) => key.isChatKey)?.row.id
        return {
            tiers,
            credits,
            keys: keyOptions,
            defaultChoice: aiModelOptionsUtils.defaultChoice({ surface, tiers, credits, keys: keyOptions, chatKeyId }),
            movedTiers,
            specificModelsHidden,
        }
    },
})

export const aiModelOptionsUtils = {
    defaultChoice({ surface, tiers, credits, keys, chatKeyId }: DefaultChoiceParams): ModelChoice | null {
        const defaultTier = tiers.find((tier) => tier.isDefault)
        if (!isNil(defaultTier)) {
            return { type: 'tier', tierId: defaultTier.id }
        }
        const chatKey = surface === 'chat' ? keys.find((key) => key.providerConfigId === chatKeyId) : undefined
        const chatKeyModel = chatKey?.models[0]
        if (!isNil(chatKey) && !isNil(chatKeyModel)) {
            return modelChoiceOf({ key: chatKey, modelId: chatKeyModel.id })
        }
        if (!isNil(credits)) {
            return { type: 'model', provider: AIProviderName.ACTIVEPIECES, providerConfigId: credits.providerConfigId, modelId: credits.defaultTierId }
        }
        if (tiers.length > 0) {
            return { type: 'tier', tierId: tiers[0].id }
        }
        const firstKey = keys.find((key) => key.models.length > 0)
        return isNil(firstKey) ? null : modelChoiceOf({ key: firstKey, modelId: firstKey.models[0].id })
    },
}

function toTierOption({ forRun, keys, lookup, callsTools }: { forRun: TierForRun, keys: ProjectKeyModels[], lookup: Lookup, callsTools: CallsTools }): ModelOptionsTier[] {
    const { tier, entries } = forRun
    const usable = entries.filter((entry) => callsTools({ provider: entry.key.provider, modelId: entry.modelId }))
    const [main, ...fallbacks] = usable
    if (isNil(main) || main !== entries[0]) {
        return []
    }
    const optionOf = (entry: TierForRun['entries'][number]): OptionModel => ({
        provider: entry.key.provider,
        modelId: entry.modelId,
        name: keys.find((key) => key.row.id === entry.key.id)?.models?.find((model) => model.id === entry.modelId)?.name ?? entry.modelId,
        keyName: entry.key.displayName,
        ...spreadIfDefined('metadata', lookup({ provider: entry.key.provider, modelId: entry.modelId })),
    })
    return [{
        id: tier.id,
        name: tier.name,
        emoji: tier.emoji,
        description: tier.description ?? null,
        isDefault: tier.isDefault,
        isFast: tier.isFast,
        main: optionOf(main),
        fallbacks: fallbacks.map(optionOf),
    }]
}

function toCredits({ row, surface, lookup }: { row: AIProviderSchema, surface: ModelOptionsSurface, lookup: Lookup }): ModelOptionsCredits {
    const catalog = modelTierCatalog.current(surface === 'chat' ? 'chat' : 'flow')
    return {
        providerConfigId: row.id,
        defaultTierId: catalog.defaultTierId,
        tiers: catalog.tiers.map((tier) => ({
            id: tier.id,
            label: tier.label,
            model: {
                provider: AIProviderName.ACTIVEPIECES,
                modelId: tier.modelId,
                name: tier.modelId,
                keyName: row.displayName,
                ...spreadIfDefined('metadata', lookup({ provider: AIProviderName.ACTIVEPIECES, modelId: tier.modelId })),
            },
        })),
    }
}

function toKeyOption({ key, surface, lookup, callsTools }: { key: ProjectKeyModels, surface: ModelOptionsSurface, lookup: Lookup, callsTools: CallsTools }): ModelOptionsKey[] {
    const { row, models } = key
    if (row.provider === AIProviderName.ACTIVEPIECES || isNil(models)) {
        return []
    }
    const textModels = models.filter((model) => model.type === AIProviderModelType.TEXT)
    const offered = surface === 'chat'
        ? chatModels({ row, textModels, lookup, callsTools })
        : textModels.filter((model) => callsTools({ provider: row.provider, modelId: model.id }))
    return offered.length === 0 ? [] : [{ providerConfigId: row.id, provider: row.provider, name: row.displayName, models: offered }]
}

function chatModels({ row, textModels, lookup, callsTools }: { row: AIProviderSchema, textModels: AIProviderModel[], lookup: Lookup, callsTools: CallsTools }): AIProviderModel[] {
    const curated = aiProviderUtils.getCuratedChatModels({ provider: row.provider })
    if (isNil(curated) || !isNil(aiKeyScope.manualModelIdsOf({ config: row.config }))) {
        return textModels.filter((model) => callsTools({ provider: row.provider, modelId: model.id }))
    }
    return curated
        .filter((model) => aiKeyScope.scopeAllows({ modelScope: row.modelScope, modelIds: row.modelIds, modelId: model.id }))
        .map((model) => textModels.find((listed) => listed.id === model.id) ?? {
            id: model.id,
            name: model.label,
            type: AIProviderModelType.TEXT,
            ...spreadIfDefined('metadata', lookup({ provider: row.provider, modelId: model.id })),
        })
}

function modelChoiceOf({ key, modelId }: { key: ModelOptionsKey, modelId: string }): ModelChoice {
    return { type: 'model', provider: key.provider, providerConfigId: key.providerConfigId, modelId }
}

type Lookup = (params: { provider: AIProviderName, modelId: string }) => OptionModel['metadata']
type CallsTools = (params: { provider: AIProviderName, modelId: string }) => boolean

type DefaultChoiceParams = {
    surface: ModelOptionsSurface
    tiers: ModelOptionsTier[]
    credits: ModelOptionsCredits | null
    keys: ModelOptionsKey[]
    chatKeyId: string | undefined
}
