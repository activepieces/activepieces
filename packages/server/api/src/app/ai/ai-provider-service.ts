import {
    ActivepiecesError, ActivePiecesProviderAuthConfig, ActivePiecesProviderConfig, AIProvider, AIProviderAuthConfig, AIProviderConfig, AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData,
    ApEdition,
    apId,
    CreateAIProviderRequest,
    ErrorCode,
    GetProviderConfigResponse,
    isNil,
    PlatformId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { system } from '../helper/system/system'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { aiProviders } from './providers'
import { AppSystemProp } from '@activepieces/server-shared'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { distributedLock } from '../database/redis-connections'
import { flagService } from '../flags/flag.service'

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
        const configuredProviders = await aiProviderRepo().findBy({ platformId })

        const formattedProviders: AIProviderWithoutSensitiveData[] = await Promise.all(configuredProviders.map(async p => {
            return {
                id: p.id,
                name: p.displayName,
                provider: p.provider,
                config: p.config,
            }
        }))

        const isActivepiecesConfigured = configuredProviders.find(p => p.provider === AIProviderName.ACTIVEPIECES)
        if (flagService.aiCreditsEnabled() && !isActivepiecesConfigured) {
            formattedProviders.push({
                id: apId(),
                name: 'Activepieces',
                provider: AIProviderName.ACTIVEPIECES,
                config: {},
            })
        }

        return formattedProviders
    },

    async listModels(platformId: PlatformId, providerId: string): Promise<AIProviderModel[]> {
        const { provider, config, authConfig } = await this.getConfigOrThrow(platformId, providerId)

        const cacheKey = `${provider}-${authConfig.apiKey}`
        if (modelsCache.has(cacheKey) && !('models' in config)) {
            return modelsCache.get(cacheKey)!
        }

        const data = await aiProviders[provider].listModels(authConfig, config)

        modelsCache.set(cacheKey, data.map(model => ({
            id: model.id,
            name: model.name,
            type: model.type,
        })))

        return modelsCache.get(cacheKey)!
    },

    async upsert(platformId: PlatformId, request: CreateAIProviderRequest, providerId?: string): Promise<void> {
        if (request.provider === AIProviderName.AZURE && system.getEdition() !== ApEdition.ENTERPRISE) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Azure OpenAI is only available for enterprise customers',
                },
            })
        }
        if (request.provider === AIProviderName.ACTIVEPIECES) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'ActivePieces provider cannot be updated',
                },
            })
        }

        await aiProviderRepo().upsert({
            id: providerId ?? apId(),
            authConfig: await encryptUtils.encryptObject(request.authConfig),
            config: request.config,
            provider: request.provider,
            displayName: request.displayName,
            platformId,
        }, ['id'])
    },

    async delete(platformId: PlatformId, providerId: string): Promise<void> {
        await aiProviderRepo().delete({
            platformId,
            id: providerId,
        })
    },

    async getConfigOrThrow(platformId: PlatformId, providerId: string): Promise<GetProviderConfigResponse> {
        if (providerId === AIProviderName.ACTIVEPIECES) {
            return getOrCreateActivepiecesConfig(platformId, log)
        }
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            id: providerId,
        })
        if (isNil(aiProvider)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: providerId,
                    entityType: 'AIProvider',
                },
            })
        }
        let authConfig = await encryptUtils.decryptObject<AIProviderAuthConfig>(aiProvider.authConfig)
        return { provider: aiProvider.provider, authConfig, config: aiProvider.config }
    },
})

async function getOrCreateActivepiecesConfig(platformId: PlatformId, log: FastifyBaseLogger): Promise<GetProviderConfigResponse> {
    const aiProvider = await aiProviderRepo().findOneBy({
        platformId,
        provider: AIProviderName.ACTIVEPIECES,
    })
    if (isNil(aiProvider)) {
        await distributedLock(log).runExclusive({
            key: `platform_ai_credits_${platformId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const providerCreated = await aiProviderRepo().existsBy({
                    provider: AIProviderName.ACTIVEPIECES,
                    platformId,
                })
                if (providerCreated) {
                    return;
                }
                const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
                const limit = ((platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.includedAiCredits) / 1000
                const { key, data } = await openRouterCreateKey(`Platform ${platformId}`, limit)
                await aiProviderRepo().save({
                    id: apId(),
                    platformId,
                    provider: AIProviderName.ACTIVEPIECES,
                    displayName: 'Activepieces',
                    config: {},
                    authConfig: await encryptUtils.encryptObject({ apiKey: key, apiKeyHash: data.hash }),
                })
            },
        })
    }
    return aiProviderService(log).getConfigOrThrow(platformId, AIProviderName.ACTIVEPIECES)
}

async function openRouterCreateKey(name: string, limit: number): Promise<{ key: string; data: { hash: string } }> {
    const apiKey = system.getOrThrow(AppSystemProp.OPENROUTER_PROVISION_KEY)
    const res = await fetch('https://openrouter.ai/api/v1/keys', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            limit,
        }),
    })
    if (!res.ok) {
        throw new Error(`Failed to create OpenRouter key: ${res.status} ${await res.text()}`)
    }
    const data = await res.json()
    return { key: data.key, data: data.data }
}
