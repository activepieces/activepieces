import { AIProviderConfig, AIProviderName, CreateAIProviderRequest } from '@activepieces/common-ai'
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
import { aiProviders } from './providers'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

export const aiProviderService = {
    async listProviders(platformId: PlatformId): Promise<SeekPage<ListAIProviderResponseItem>> {
        const configuredProviders = await aiProviderRepo().findBy({ platformId })

        const data: ListAIProviderResponseItem[] = [];

        for (const id of Object.values(AIProviderName)) {
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

    async listModels(platformId: PlatformId, providerId: AIProviderName): Promise<SeekPage<ListModelsResponseItem>> {
        const { config } = await this.getConfig(platformId, providerId)

        const provider = aiProviders[providerId]
        const data = await provider.listModels(config)

        return { data, next: null, previous: null }
    },

    async upsert(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        if (request.provider === AIProviderName.Azure && system.getEdition() !== ApEdition.ENTERPRISE) {
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

        const config = await encryptUtils.decryptObject<AIProviderConfig>(aiProvider.config)

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
    config: AIProviderConfig;
}

