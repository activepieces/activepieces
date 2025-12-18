import { ActivepiecesError, ActivePiecesProviderConfig, AIProviderConfig, AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData,
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
            const { apiKey: _, ...rest } = await encryptUtils.decryptObject<AIProviderConfig>(p.config)

            return {
                id: p.id,
                name: p.displayName,
                provider: p.provider,
                config: rest,
                configured: true,
            }
        }))

        if (flagService.aiCreditsEnabled()) {
            if (!formattedProviders.find(p => p.provider === AIProviderName.ACTIVEPIECES)) {
                await this._createActivepiecesProvider(platformId)

                return this.listProviders(platformId)
            }
        }

        return formattedProviders
    },

    async listModels(platformId: PlatformId, providerId: string): Promise<AIProviderModel[]> {
        const config = await this.getConfig(platformId, providerId)

        const cacheKey = `${config.provider}-${config.apiKey}`
        if (modelsCache.has(cacheKey) && !('models' in config)) {
            return modelsCache.get(cacheKey)!
        }

        const provider = aiProviders[config.provider]
        const data = await provider.listModels(config)

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

        // if the user update a part of the config, he can keep the api key empty
        if (request.config.apiKey.length === 0) {
            const record = await aiProviderRepo().findOneBy({
                platformId,
                provider: request.provider,
            })
            if (record) {
                const config = await encryptUtils.decryptObject<AIProviderConfig>(record.config)
                request.config.apiKey = config.apiKey
            }
            else {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'Should not send an empty api key',
                    },
                })
            }
        }

        await aiProviderRepo().upsert({
            id: providerId ?? apId(),
            config: await encryptUtils.encryptObject(request.config),
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

    async getConfig(platformId: PlatformId, providerId: string): Promise<GetProviderConfigResponse> {
        const aiProvider = await aiProviderRepo().findOneByOrFail({
            platformId,
            id: providerId,
        })

        const decrypted = await encryptUtils.decryptObject<AIProviderConfig>(aiProvider.config)

        return { provider: aiProvider.provider, ...decrypted }
    },

    async getActivePiecesProviderConfig(platformId: PlatformId): Promise<ActivePiecesProviderConfig> {
        if (!flagService.aiCreditsEnabled()) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'AI credits are disabled',
                },
            })
        }

        const aiProvider = await aiProviderRepo().findOneBy({
            provider: AIProviderName.ACTIVEPIECES,
            platformId,
        })
        if (isNil(aiProvider)) {
            await this._createActivepiecesProvider(platformId)

            return await this.getActivePiecesProviderConfig(platformId)
        }

        const decrypted = await encryptUtils.decryptObject<ActivePiecesProviderConfig>(aiProvider.config)

        return decrypted
    },

    async _createActivepiecesProvider(platformId: PlatformId): Promise<ActivePiecesProviderConfig> {
        const { hash, key } = await this._createOpenRouterKey(platformId)

        const config: ActivePiecesProviderConfig = { apiKey: key, apiKeyHash: hash }

        await aiProviderRepo().upsert({
            id: apId(),
            config: await encryptUtils.encryptObject(config),
            provider: AIProviderName.ACTIVEPIECES,
            displayName: aiProviders[AIProviderName.ACTIVEPIECES].name,
            platformId,
        }, ['id'])

        return config
    },

    async _createOpenRouterKey(platformId: string): Promise<{ key: string; hash: string }> {
        return distributedLock(log).runExclusive({
            key: `platform_ai_credits_${platformId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const aiProvider = await aiProviderRepo().findOneBy({
                    provider: AIProviderName.ACTIVEPIECES,
                    platformId,
                })
                if (!isNil(aiProvider)) {
                    const decrypted = await encryptUtils.decryptObject<ActivePiecesProviderConfig>(aiProvider.config)
                    
                    return { key: decrypted.apiKey, hash: decrypted.apiKeyHash }
                }

                const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
                const limit = ((platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.includedAiCredits) / 1000

                console.log(limit)
                const { key, data } = await openRouterCreateKey(`Platform ${platformId}`, limit)

                return { key, hash: data.hash }
            },
        })
    },
})

async function openRouterCreateKey(name: string, limit: number): Promise<{ key: string; data: { hash: string }}> {
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
