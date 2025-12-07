import { AIProviderConfig, AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData, CreateAIProviderRequest } from '@activepieces/common-ai'
import {
    ActivepiecesError,
    ApEdition,
    apId,
    ErrorCode,
    PlatformId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { platformAiCreditsService } from '../ee/platform/platform-plan/platform-ai-credits'
import { encryptUtils } from '../helper/encryption'
import { system } from '../helper/system/system'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { aiProviders } from './providers'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

export const aiProviderService = (log: FastifyBaseLogger) => ({
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

        const provider = aiProviders[providerId]
        const data = await provider.listModels(config)

        return data.map(model => ({
            id: model.id,
            name: model.name,
            type: model.type,
        }))
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
