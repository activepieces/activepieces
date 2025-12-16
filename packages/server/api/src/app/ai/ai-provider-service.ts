import { ActivepiecesError, AIProviderConfig, AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData,
    ApEdition,
    apId,
    CreateAIProviderRequest,
    ErrorCode,
    GetProviderConfigResponse,
    PlatformId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { repoFactory } from '../core/db/repo-factory'
import { platformAiCreditsService } from '../ee/platform/platform-plan/platform-ai-credits'
import { encryptUtils } from '../helper/encryption'
import { system } from '../helper/system/system'
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
        const configuredProviders = await aiProviderRepo().findBy({ platformId })

        const formattedProviders: AIProviderWithoutSensitiveData[] = configuredProviders.map(p => ({ 
            id: p.id,
            name: p.displayName,
            provider: p.provider,
            configured: true,
        }))

        const enableOpenRouterProvider = platformAiCreditsService(log).isEnabled()
        if (enableOpenRouterProvider) {
            formattedProviders.push({
                id: AIProviderName.ACTIVEPIECES,
                name: aiProviders[AIProviderName.ACTIVEPIECES].name,
                provider: AIProviderName.ACTIVEPIECES,
                configured: true,
            })
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

        // if the user update a part of the config, he can keep the api key empty
        if (request.config.apiKey.length === 0) {
            const record = await aiProviderRepo().findOneBy({
                platformId,
                provider: request.provider,
            })
            if (record) {
                const config = await encryptUtils.decryptObject<AIProviderConfig>(record.config)
                request.config.apiKey = config.apiKey
            } else {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_REQUEST_NOT_SUPPORTED,
                    params: {
                        message: `Should not send an empty api key`
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
        if (providerId === AIProviderName.ACTIVEPIECES) {
            const provisionedKey = await platformAiCreditsService(log).provisionKeyIfNeeded(platformId)
            return {
                provider: AIProviderName.ACTIVEPIECES,
                apiKey: provisionedKey.key,
            }
        }

        const aiProvider: AIProviderSchema = await aiProviderRepo().findOneByOrFail({
            platformId,
            id: providerId,
        })

        const decrypted = await encryptUtils.decryptObject<AIProviderConfig>(aiProvider.config)

        return { provider: aiProvider.provider, ...decrypted }
    },
})
