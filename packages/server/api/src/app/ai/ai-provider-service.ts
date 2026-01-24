import {
    ActivepiecesError, ActivePiecesProviderAuthConfig, AIProviderAuthConfig, AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData,
    apId,
    CreateAIProviderRequest,
    ErrorCode,
    GetProviderConfigResponse,
    isNil,
    PlatformId,
    spreadIfDefined,
    UpdateAIProviderRequest,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { In } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { openRouterApi } from '../ee/platform/platform-plan/openrouter/openrouter-api'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { flagService } from '../flags/flag.service'
import { encryptUtils } from '../helper/encryption'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { aiProviders } from './providers'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

const modelsCache = new Map<string, AIProviderModel[]>()

export const aiProviderService = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        cron.schedule('0 0 * * *', () => {
            log.info('Clearing AI provider models cache')
            modelsCache.clear()
        })
    },

    async listProviders(platformId: PlatformId): Promise<AIProviderWithoutSensitiveData[]> {
        const activepiecesExists = await aiProviderRepo().existsBy({
            platformId,
            provider: AIProviderName.ACTIVEPIECES,
        })

        if (flagService.aiCreditsEnabled() && !activepiecesExists) {
            await aiProviderRepo().save({
                id: apId(),
                auth: await encryptUtils.encryptObject({}),
                config: {},
                provider: AIProviderName.ACTIVEPIECES,
                displayName: 'Activepieces',
                platformId,
            })
        }
        const configuredProviders = await aiProviderRepo().findBy({ platformId })

        const formattedProviders: AIProviderWithoutSensitiveData[] = await Promise.all(configuredProviders.map(async p => {
            return {
                id: p.id,
                name: p.displayName,
                provider: p.provider,
                config: p.config,
            }
        }))
        return formattedProviders
    },

    async listModels(platformId: PlatformId, provider: AIProviderName): Promise<AIProviderModel[]> {
        const { config, auth } = await this.getConfigOrThrow({ platformId, provider })

        const cacheKey = `${provider}-${auth.apiKey}`
        if (modelsCache.has(cacheKey) && !('models' in config)) {
            return modelsCache.get(cacheKey)!
        }

        const data = await aiProviders[provider].listModels(auth, config)

        modelsCache.set(cacheKey, data.map(model => ({
            id: model.id,
            name: model.name,
            type: model.type,
        })))

        return modelsCache.get(cacheKey)!
    },

    async create(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        await aiProviderRepo().save({
            id: apId(),
            auth: await encryptUtils.encryptObject(request.auth),
            config: request.config,
            provider: request.provider,
            displayName: request.displayName,
            platformId,
        })
    },
    async update(platformId: PlatformId, providerId: string, request: UpdateAIProviderRequest): Promise<void> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            id: providerId,
        })
        if (isNil(aiProvider) || aiProvider.provider === AIProviderName.ACTIVEPIECES) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: providerId, entityType: 'AIProvider' },
            })
        }

        const encryptedAuth = !isNil(request.auth) ? await encryptUtils.encryptObject(request.auth) : undefined
        await aiProviderRepo().update(providerId, {
            ...spreadIfDefined('auth', encryptedAuth),
            ...spreadIfDefined('config', request.config),
            displayName: request.displayName,
        })
    },

    async delete(platformId: PlatformId, providerId: string): Promise<void> {
        await aiProviderRepo().delete({
            platformId,
            id: providerId,
        })
    },
    async getConfigOrThrow({ platformId, provider }: GetOrCreateActivepiecesConfigResponse): Promise<GetProviderConfigResponse> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            provider,
        })
        if (isNil(aiProvider)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: provider,
                    entityType: 'AIProvider',
                },
            })
        }

        let auth = await encryptUtils.decryptObject<AIProviderAuthConfig>(aiProvider.auth)

        if (aiProvider.provider === AIProviderName.ACTIVEPIECES) {
            const doesHaveKeys = !isNil(auth) && !isNil(auth.apiKey) && auth.apiKey !== ''
            if (!doesHaveKeys) {
                const { auth: activePiecesAuth } = await enrichWithKeysIfNeeded(aiProvider, platformId, log)

                auth = activePiecesAuth
            }

            await systemJobsSchedule(log).upsertJob({
                job: {
                    name: SystemJobName.AI_CREDIT_UPDATE_CHECK,
                    data: { apiKeyHash: (auth as ActivePiecesProviderAuthConfig).apiKeyHash, platformId },
                },
                schedule: {
                    type: 'one-time',
                    date: dayjs(),
                },
            })
        }
        
        
        return { provider: aiProvider.provider, auth, config: aiProvider.config }
    },
    async getActivepiecesProviderIfEnriched(platformId: PlatformId): Promise<ActivePiecesProviderAuthConfig | null> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            provider: AIProviderName.ACTIVEPIECES,
        })
        if (isNil(aiProvider)) {
            return null
        }
        const doesHaveKeys = await doesActivepiecesProviderHasKeys(aiProvider)
        if (!doesHaveKeys) {
            return null
        }
        const { auth } = await this.getConfigOrThrow({ platformId, provider: aiProvider.provider })

        return auth as ActivePiecesProviderAuthConfig
    },

    async getOrCreateActivePiecesProviderAuthConfig(platformId: PlatformId): Promise<ActivePiecesProviderAuthConfig> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            provider: AIProviderName.ACTIVEPIECES,
        })
        if (isNil(aiProvider)) {
            await aiProviderRepo().save({
                id: apId(),
                auth: await encryptUtils.encryptObject({}),
                config: {},
                provider: AIProviderName.ACTIVEPIECES,
                displayName: 'Activepieces',
                platformId,
            })
        }

        const { auth } = await this.getConfigOrThrow({ platformId, provider: AIProviderName.ACTIVEPIECES })
        return auth as ActivePiecesProviderAuthConfig
    },

    async getAllActivePiecesProvidersConfigs(platformIds?: string[]): Promise<{ [platformId: string]: ActivePiecesProviderAuthConfig }> {
        const aiProviders = await aiProviderRepo().find({
            where: {
                provider: AIProviderName.ACTIVEPIECES,
                platformId: platformIds?.length ? In(platformIds) : undefined,
            },
        })

        const result: { [platformId: string]: ActivePiecesProviderAuthConfig } = {}
        for (const aiProvider of aiProviders) {
            const hasKeys = await doesActivepiecesProviderHasKeys(aiProvider)
            if (!hasKeys) continue

            result[aiProvider.platformId] = await encryptUtils.decryptObject<ActivePiecesProviderAuthConfig>(aiProvider.auth)
        }

        return result
    },
})

type GetOrCreateActivepiecesConfigResponse = {
    platformId: PlatformId
    provider: AIProviderName
}

async function enrichWithKeysIfNeeded(aiProvider: AIProviderSchema, platformId: PlatformId, log: FastifyBaseLogger): Promise<GetProviderConfigResponse> {
    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
    const limit = platformPlan.includedAiCredits / 1000
    const { key, data } = await openRouterApi.createKey({
        name: `Platform ${platformId}`, 
        limit,
    })
    const rawAuth: ActivePiecesProviderAuthConfig = { apiKey: key, apiKeyHash: data.hash }
    const savedAiProvider = await aiProviderRepo().save({
        id: aiProvider.id,
        platformId,
        provider: AIProviderName.ACTIVEPIECES,
        displayName: 'Activepieces',
        config: {},
        auth: await encryptUtils.encryptObject(rawAuth),
    })
    await platformPlanService(log).update({
        platformId,
        lastFreeAiCreditsRenewalDate: new Date().toISOString(),
    })
    return { provider: savedAiProvider.provider, auth: rawAuth, config: savedAiProvider.config }
}


async function doesActivepiecesProviderHasKeys(aiProvider: AIProviderSchema): Promise<boolean> {
    if (isNil(aiProvider) || isNil(aiProvider.auth)) {
        return false
    }
    const decryptedAuth = await encryptUtils.decryptObject<ActivePiecesProviderAuthConfig>(aiProvider.auth)
    return !isNil(decryptedAuth) && !isNil(decryptedAuth.apiKey) && decryptedAuth.apiKey !== ''
}
