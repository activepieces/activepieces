import { AIProviderName, isNil, PlatformId, spreadIfDefined } from '@activepieces/core-utils'
import { modelCatalog, modelTierCatalog } from '@activepieces/server-utils'
import { AIProviderModel, AIProviderModelType, aiProviderUtils, ModelChoice, ModelOptions, ModelOptionsCredits, ModelOptionsKey, ModelOptionsSurface, ModelOptionsTier, OptionModel, PlatformConfiguration } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformConfigurationService } from '../platform/platform-configuration.service'
import { aiKeyScope } from './ai-key-scope'
import { AIProviderSchema } from './ai-provider-entity'
import { aiProviderService, ProjectKeyModels } from './ai-provider-service'
import { platformModelTierService, TierForRun } from './platform-model-tier-service'

export const aiModelOptionsService = (log: FastifyBaseLogger) => ({
    async list({ platformId, projectId, surface, tierId }: { platformId: PlatformId, projectId: string, surface: ModelOptionsSurface, tierId?: string }): Promise<ModelOptions> {
        const configuration = await platformConfigurationService(log).getOrCreateForPlatform({ platformId })
        const [keys, tiersForRun, movedTiers, catalog] = await Promise.all([
            aiProviderService(log).listKeysForProject({ platformId, projectId }),
            platformModelTierService.listForPicker({ platformId, scope: { type: 'project', projectId } }),
            platformModelTierService.movedTiers({ platformId, tierIds: [tierId, tierIdOf(configuration.defaultChatModel)] }),
            modelCatalog.load(),
        ])
        return buildOptions({ keys, tiersForRun, movedTiers, configuration, catalog, surface })
    },

    async listForPlatform({ platformId, surface, platformDefault }: { platformId: PlatformId, surface: ModelOptionsSurface, platformDefault?: ModelChoice | null }): Promise<ModelOptions> {
        const configuration = await platformConfigurationService(log).getOrCreateForPlatform({ platformId })
        const chatDefault = platformDefault === undefined ? configuration.defaultChatModel ?? null : platformDefault
        const [keys, tiersForRun, movedTiers, catalog] = await Promise.all([
            aiProviderService(log).listKeysForPlatform({ platformId }),
            platformModelTierService.listForPicker({ platformId, scope: { type: 'platform' }, anyProject: true }),
            platformModelTierService.movedTiers({ platformId, tierIds: [tierIdOf(chatDefault)] }),
            modelCatalog.load(),
        ])
        return buildOptions({ keys, tiersForRun, movedTiers, configuration: { ...configuration, defaultChatModel: chatDefault, aiSpecificModelsVisible: true }, catalog, surface })
    },
})

export const aiModelOptionsUtils = {
    usableChoice,
    defaultChoice({ surface, tiers, credits, keys, chatKeyId, platformDefault, movedTiers }: DefaultChoiceParams): ModelChoice | null {
        const chatLike = surface !== 'flow'
        const usableDefault = chatLike && !isNil(platformDefault)
            ? usableChoice({ choice: platformDefault, tiers, credits, keys, movedTiers: movedTiers ?? {} })
            : null
        if (!isNil(usableDefault)) {
            return usableDefault
        }
        const defaultTier = tiers.find((tier) => tier.isDefault)
        if (!isNil(defaultTier)) {
            return { type: 'tier', tierId: defaultTier.id }
        }
        const chatKey = chatLike ? keys.find((key) => key.providerConfigId === chatKeyId) : undefined
        const chatKeyModelId = isNil(chatKey) ? undefined : firstRunnableModelId({ key: chatKey })
        if (!isNil(chatKey) && !isNil(chatKeyModelId)) {
            return modelChoiceOf({ key: chatKey, modelId: chatKeyModelId })
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

function buildOptions({ keys, tiersForRun, movedTiers, configuration, catalog, surface }: BuildOptionsParams): ModelOptions {
    const lookup: Lookup = ({ provider, modelId }) => catalog.lookup({ provider, modelId })
    const callsTools: CallsTools = ({ provider, modelId }) => surface === 'flow' || lookup({ provider, modelId })?.supportsToolCalling !== false
    const tiers = tiersForRun.flatMap((forRun) => toTierOption({ forRun, keys, lookup, callsTools }))
    const creditsKey = keys.find((key) => key.row.provider === AIProviderName.ACTIVEPIECES)
    const credits = isNil(creditsKey) ? null : toCredits({ row: creditsKey.row, surface, lookup })
    const specificModelsHidden = !configuration.aiSpecificModelsVisible
    const allKeyOptions = keys.flatMap((key) => toKeyOption({ key, surface, lookup, callsTools }))
    const keyOptions = specificModelsHidden
        ? onlyPlatformDefault({ keys: allKeyOptions, platformDefault: surface === 'flow' ? null : configuration.defaultChatModel ?? null })
        : allKeyOptions
    const chatKeyId = keys.find((key) => key.isChatKey)?.row.id
    return {
        tiers,
        credits,
        keys: keyOptions,
        defaultChoice: aiModelOptionsUtils.defaultChoice({ surface, tiers, credits, keys: keyOptions, chatKeyId, platformDefault: configuration.defaultChatModel ?? null, movedTiers }),
        movedTiers,
        specificModelsHidden,
    }
}

function usableChoice({ choice, tiers, credits, keys, movedTiers }: { choice: ModelChoice, tiers: ModelOptionsTier[], credits: ModelOptionsCredits | null, keys: ModelOptionsKey[], movedTiers: Record<string, string> }): ModelChoice | null {
    if (choice.type === 'tier') {
        const tierId = movedTiers[choice.tierId] ?? choice.tierId
        return tiers.some((tier) => tier.id === tierId) ? { type: 'tier', tierId } : null
    }
    if (choice.provider === AIProviderName.ACTIVEPIECES) {
        return !isNil(credits) && credits.tiers.some((tier) => tier.id === choice.modelId)
            ? { ...choice, providerConfigId: credits.providerConfigId }
            : null
    }
    const offered = keys.some((key) => key.providerConfigId === choice.providerConfigId && key.models.some((model) => model.id === choice.modelId))
    return offered ? choice : null
}

function onlyPlatformDefault({ keys, platformDefault }: { keys: ModelOptionsKey[], platformDefault: ModelChoice | null }): ModelOptionsKey[] {
    if (isNil(platformDefault) || platformDefault.type !== 'model' || platformDefault.provider === AIProviderName.ACTIVEPIECES) {
        return []
    }
    return keys.flatMap((key) => {
        const models = key.providerConfigId === platformDefault.providerConfigId ? key.models.filter((model) => model.id === platformDefault.modelId) : []
        return models.length === 0 ? [] : [{ ...key, models }]
    })
}

function firstRunnableModelId({ key }: { key: ModelOptionsKey }): string | undefined {
    const runnable = aiProviderUtils.runnableChatModelIds({ provider: key.provider })
    return runnable.find((modelId) => key.models.some((model) => model.id === modelId)) ?? key.models[0]?.id
}

function tierIdOf(choice: ModelChoice | null | undefined): string | undefined {
    return choice?.type === 'tier' ? choice.tierId : undefined
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
    const toolModels = models
        .filter((model) => model.type === AIProviderModelType.TEXT)
        .filter((model) => callsTools({ provider: row.provider, modelId: model.id }))
    const offered = surface === 'chat' ? chatModels({ row, toolModels, lookup }) : toolModels
    return offered.length === 0 ? [] : [{ providerConfigId: row.id, provider: row.provider, name: row.displayName, models: offered }]
}

function chatModels({ row, toolModels, lookup }: { row: AIProviderSchema, toolModels: AIProviderModel[], lookup: Lookup }): AIProviderModel[] {
    const curated = aiProviderUtils.getCuratedChatModels({ provider: row.provider })
    if (isNil(curated) || !isNil(aiKeyScope.manualModelIdsOf({ config: row.config }))) {
        return toolModels
    }
    const runnable = aiProviderUtils.runnableChatModelIds({ provider: row.provider })
    return toolModels.filter((model) => runnable.includes(model.id) || lookup({ provider: row.provider, modelId: model.id })?.supportsToolCalling === true)
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
    platformDefault?: ModelChoice | null
    movedTiers?: Record<string, string>
}

type BuildOptionsParams = {
    keys: ProjectKeyModels[]
    tiersForRun: TierForRun[]
    movedTiers: Record<string, string>
    configuration: PlatformConfiguration
    catalog: Awaited<ReturnType<typeof modelCatalog.load>>
    surface: ModelOptionsSurface
}
