import { CreateAIProviderRequest } from '@activepieces/common-ai'
import {
    ActivepiecesError,
    ApEdition,
    apId,
    ErrorCode,
    PlatformId,
    SeekPage,
} from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { system } from '../helper/system/system'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { AiProviderConfig, aiProviders } from './providers'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

export const aiProviderService = {
    async listProviders(platformId: PlatformId): Promise<SeekPage<ListAIProviderResponseItem>> {
        const configuredProviders = await aiProviderRepo().findBy({ platformId })

        const data: ListAIProviderResponseItem[] = [];

        for (const id of Object.keys(aiProviders)) {
            const isConfigured = configuredProviders.find(c => c.provider === id)
            const provider = aiProviders[id]

            data.push({
                id,
                name: provider.name(),
                isConfigured: !!isConfigured,
            })
        }

        return { data, next: null, previous: null }
    },

    async listModels(platformId: PlatformId, providerId: string): Promise<SeekPage<ListModelsResponseItem>> {
        const configured = await aiProviderRepo().findOneByOrFail({ platformId, provider: providerId })

        const provider = aiProviders[providerId]
        const data = await provider.listModels(configured.config)

        return { data, next: null, previous: null }
    },

    async upsert(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        if (request.provider === 'azure' && system.getEdition() !== ApEdition.ENTERPRISE) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Azure OpenAI is only available for enterprise customers',
                },
            })
        }

        await aiProviderRepo().upsert({
            id: apId(),
            config: await encryptUtils.encryptObject({
                apiKey: request.apiKey,
                resourceName: request.resourceName,
            }),
            provider: request.provider,
            platformId,
        }, ['provider', 'platformId'])
    },

    async delete(platformId: PlatformId, provider: string): Promise<void> {
        await aiProviderRepo().delete({
            platformId,
            provider,
        })
    },

    async getConfig(platformId: PlatformId, providerId: string): Promise<GetProviderConfigResponse> {
        const aiProvider = await aiProviderRepo().findOneOrFail({
            where: {
                provider: providerId,
                platformId,
            },
            select: {
                config: {
                    iv: true,
                    data: true,
                },
            },
        })

        const config = await encryptUtils.decryptObject<AiProviderConfig[keyof AiProviderConfig]>(aiProvider.config)

        return { config }
    },
}

export type ListAIProviderResponseItem = {
    id: string;
    name: string;
    isConfigured: boolean;
}

export type ListModelsResponseItem = {
    id: string;
    name: string;
    type: 'text' | 'image';
}

export type GetProviderConfigResponse = {
    config: AiProviderConfig[keyof AiProviderConfig];
}

