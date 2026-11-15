import { ActivepiecesError, AIProviderName, apId, chunk, ErrorCode, isEmpty, isNil, spreadIfNotUndefined, tryCatch } from '@activepieces/core-utils'
import { ApEdition, maxBarrierSignalsBounds, ModelChoice, PlatformConfiguration, UpdatePlatformConfigurationRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In } from 'typeorm'
import { aiModelOptionsService, aiModelOptionsUtils } from '../ai/ai-model-options-service'
import { AIProviderEntity } from '../ai/ai-provider-entity'
import { aiProviderService } from '../ai/ai-provider-service'
import { platformModelTierService } from '../ai/platform-model-tier-service'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { distributedLock } from '../database/redis-connections'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { PlatformConfigurationEntity } from './platform-configuration.entity'

const platformConfigurationRepo = repoFactory(PlatformConfigurationEntity)

const CREATE_LOCK_TIMEOUT_SECONDS = 60
const CONFIGURATION_FILTER_BATCH_SIZE = 1_000
const DEFAULT_CHAT_MODEL_UNAVAILABLE = 'This model is not available for chat on this platform'

export const platformConfigurationService = (log: FastifyBaseLogger) => ({
    async getOrCreateForPlatform({ platformId }: GetOrCreateParams): Promise<PlatformConfiguration> {
        const existing = await platformConfigurationRepo().findOneBy({ platformId })
        if (!isNil(existing)) {
            return existing
        }

        return distributedLock(log).runExclusive({
            key: `platform_configuration_${platformId}`,
            timeoutInSeconds: CREATE_LOCK_TIMEOUT_SECONDS,
            fn: async () => {
                const configuration = await platformConfigurationRepo().findOneBy({ platformId })
                if (!isNil(configuration)) {
                    return configuration
                }
                return createInitialConfiguration({ platformId })
            },
        })
    },

    async isProductTelemetryEnabled({ platformId }: GetOrCreateParams): Promise<boolean> {
        if (system.getEdition() === ApEdition.CLOUD) {
            return true
        }
        const configuration = await this.getOrCreateForPlatform({ platformId })
        return configuration.isProductTelemetryEnabled
    },

    async maxBarrierSignals({ platformId }: GetOrCreateParams): Promise<number> {
        if (system.getEdition() === ApEdition.CLOUD) {
            return clampBarrierSignalCap(system.getNumberOrThrow(AppSystemProp.MAX_BARRIER_SIGNALS))
        }
        const configuration = await this.getOrCreateForPlatform({ platformId })
        return configuration.maxBarrierSignals
    },

    async filterProjectsWithProductTelemetryEnabled({ projectIds }: FilterProjectsParams): Promise<string[]> {
        if (projectIds.length === 0) {
            return []
        }
        if (system.getEdition() === ApEdition.CLOUD) {
            return projectIds
        }
        const fallback = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED) ?? true
        const enabled: string[] = []
        for (const batch of chunk(projectIds, CONFIGURATION_FILTER_BATCH_SIZE)) {
            const rows: { id: string }[] = await platformConfigurationRepo().manager
                .createQueryBuilder()
                .select('project.id', 'id')
                .from('project', 'project')
                .leftJoin('platform_configuration', 'configuration', 'configuration."platformId" = project."platformId"')
                .where('project.id IN (:...projectIds)', { projectIds: batch })
                .andWhere('COALESCE(configuration."isProductTelemetryEnabled", :fallback) = true', { fallback })
                .getRawMany()
            enabled.push(...rows.map((row) => row.id))
        }
        return enabled
    },

    async filterPlatformsWithInfraSetupTelemetryEnabled({ platformIds }: FilterPlatformsParams): Promise<string[]> {
        if (platformIds.length === 0) {
            return []
        }
        if (system.getEdition() === ApEdition.CLOUD) {
            return platformIds
        }
        const optedOut: string[] = []
        for (const batch of chunk(platformIds, CONFIGURATION_FILTER_BATCH_SIZE)) {
            const rows = await platformConfigurationRepo().find({
                where: { platformId: In(batch), isInfraSetupTelemetryEnabled: false },
                select: ['platformId'],
            })
            optedOut.push(...rows.map((row) => row.platformId))
        }
        const optedOutIds = new Set(optedOut)
        return platformIds.filter((platformId) => !optedOutIds.has(platformId))
    },

    async update({ platformId, isProductTelemetryEnabled, isInfraSetupTelemetryEnabled, maxBarrierSignals, aiSpecificModelsVisible, defaultChatModel }: UpdateParams): Promise<PlatformConfiguration> {
        await this.getOrCreateForPlatform({ platformId })
        const chatModel = isNil(defaultChatModel) ? defaultChatModel : await offeredChatModelOrThrow({ platformId, choice: defaultChatModel, log })
        const patch = {
            ...spreadIfNotUndefined('isProductTelemetryEnabled', isProductTelemetryEnabled),
            ...spreadIfNotUndefined('isInfraSetupTelemetryEnabled', isInfraSetupTelemetryEnabled),
            ...spreadIfNotUndefined('maxBarrierSignals', maxBarrierSignals),
            ...spreadIfNotUndefined('aiSpecificModelsVisible', aiSpecificModelsVisible),
            ...spreadIfNotUndefined('defaultChatModel', chatModel),
        }
        if (!isEmpty(patch)) {
            await transaction(async (manager) => {
                if (!isNil(aiSpecificModelsVisible)) {
                    await platformModelTierService.assertSpecificModelsVisibilityAllowed({ manager, platformId, visible: aiSpecificModelsVisible })
                }
                if (!isNil(chatModel)) {
                    await platformModelTierService.lockPlatform({ manager, platformId })
                    const defaultKeyId = await defaultKeyIdOf({ manager, platformId, choice: chatModel })
                    if (isNil(defaultKeyId)) {
                        throw chatModelUnavailableError()
                    }
                    await aiProviderService(log).markDefaultKey({ manager, platformId, configId: defaultKeyId })
                }
                await platformConfigurationRepo(manager).update({ platformId }, patch)
            })
        }
        return platformConfigurationRepo().findOneByOrFail({ platformId })
    },
})

async function offeredChatModelOrThrow({ platformId, choice, log }: { platformId: string, choice: ModelChoice, log: FastifyBaseLogger }): Promise<ModelChoice> {
    const { data: options } = await tryCatch(() => aiModelOptionsService(log).listForPlatform({ platformId, surface: 'chat', platformDefault: choice }))
    const usable = isNil(options) ? null : aiModelOptionsUtils.usableChoice({ choice, tiers: options.tiers, credits: options.credits ?? null, keys: options.keys, movedTiers: options.movedTiers })
    if (isNil(usable)) {
        throw chatModelUnavailableError()
    }
    return usable
}

async function defaultKeyIdOf({ manager, platformId, choice }: { manager: EntityManager, platformId: string, choice: ModelChoice }): Promise<string | null> {
    if (choice.type === 'tier') {
        return platformModelTierService.mainKeyIdOf({ manager, platformId, tierId: choice.tierId })
    }
    const where = choice.provider === AIProviderName.ACTIVEPIECES
        ? { platformId, provider: AIProviderName.ACTIVEPIECES }
        : { platformId, id: choice.providerConfigId }
    const key = await manager.getRepository(AIProviderEntity).findOneBy(where)
    return key?.id ?? null
}

function chatModelUnavailableError(): ActivepiecesError {
    return new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: DEFAULT_CHAT_MODEL_UNAVAILABLE } })
}

async function createInitialConfiguration({ platformId }: GetOrCreateParams): Promise<PlatformConfiguration> {
    const isProductTelemetryEnabled = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED)
    const configuredMaxBarrierSignals = system.getNumber(AppSystemProp.MAX_BARRIER_SIGNALS)
    const maxBarrierSignals = isNil(configuredMaxBarrierSignals) ? undefined : clampBarrierSignalCap(configuredMaxBarrierSignals)
    return platformConfigurationRepo().save({
        id: apId(),
        platformId,
        ...spreadIfNotUndefined('isProductTelemetryEnabled', isProductTelemetryEnabled),
        ...spreadIfNotUndefined('maxBarrierSignals', maxBarrierSignals),
    })
}

function clampBarrierSignalCap(configured: number): number {
    return Math.min(Math.max(configured, maxBarrierSignalsBounds.min), maxBarrierSignalsBounds.max)
}

type GetOrCreateParams = {
    platformId: string
}

type UpdateParams = GetOrCreateParams & UpdatePlatformConfigurationRequestBody

type FilterProjectsParams = {
    projectIds: string[]
}

type FilterPlatformsParams = {
    platformIds: string[]
}
