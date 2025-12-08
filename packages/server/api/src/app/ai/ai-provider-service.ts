import { ActivepiecesError, AIProviderConfig, AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData,
    ApEdition,
    apId,
    CreateAIProviderRequest,
    ErrorCode,
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
        const enableOpenRouterProvider = platformAiCreditsService(log).isEnabled()
        const configuredProviders = await aiProviderRepo().findBy({ platformId })
        const formattedProviders: AIProviderWithoutSensitiveData[] = Object.values(AIProviderName).filter(id => id !== AIProviderName.ACTIVEPIECES).map(id => {
            return {
                id,
                name: aiProviders[id].name,
                configured: !!configuredProviders.find(c => c.provider === id),
            }
        })
        if (enableOpenRouterProvider) {
            formattedProviders.push({
                id: AIProviderName.ACTIVEPIECES,
                name: aiProviders[AIProviderName.ACTIVEPIECES].name,
                configured: true,
            })
        }
        return formattedProviders
    },

    async listModels(platformId: PlatformId, providerId: AIProviderName): Promise<AIProviderModel[]> {
        const config = await this.getConfig(platformId, providerId)
        
        const cacheKey = `${providerId}-${config.apiKey}`
        if (modelsCache.has(cacheKey)) {
            return modelsCache.get(cacheKey)!
        }

        const provider = aiProviders[providerId]
        const data = await provider.listModels(config)

        modelsCache.set(cacheKey, data.map(model => ({
            id: model.id,
            name: model.name,
            type: model.type,
        })))

        return modelsCache.get(cacheKey)!
    },

    async upsert(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        if (request.provider === AIProviderName.AZURE && system.getEdition() !== ApEdition.ENTERPRISE) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Azure OpenAI is only available for enterprise customers',
                },
            })
        }

        await aiProviderRepo().upsert({
            id: apId(),
            config: await encryptUtils.encryptObject(request.config),
            provider: request.provider,
            platformId,
        }, ['provider', 'platformId'])
    },

    async delete(platformId: PlatformId, provider: AIProviderName): Promise<void> {
        await aiProviderRepo().delete({
            platformId,
            provider,
        })
    },

    async getConfig(platformId: PlatformId, providerId: AIProviderName): Promise<GetProviderConfigResponse> {
        if (providerId === AIProviderName.ACTIVEPIECES) {
            const provisionedKey = await platformAiCreditsService(log).provisionKeyIfNeeded(platformId)
            return {
                apiKey: provisionedKey.key,
            }
        }
        const aiProvider = await aiProviderRepo().findOneByOrFail({
            platformId,
            provider: providerId,
        })
        return encryptUtils.decryptObject<AIProviderConfig>(aiProvider.config)
    },
})

export type GetProviderConfigResponse = AIProviderConfig
