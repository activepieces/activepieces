import {
    apId,
    ConfiguredAIProvider,
    ConfiguredAIProviderWithoutSensitiveData,
    CreateAIProviderRequest,
    PlatformId,
    SeekPage,
} from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { ConfiguredAIProviderEntity } from './ai-provider-entity'

const configuredAIProviderRepo = repoFactory<ConfiguredAIProvider>(ConfiguredAIProviderEntity)

export const aiProviderService = {
    async list(platformId: PlatformId): Promise<SeekPage<ConfiguredAIProviderWithoutSensitiveData>> {
        const providers = await configuredAIProviderRepo().findBy({ platformId })

        const configuredProviders = providers.map((provider): ConfiguredAIProviderWithoutSensitiveData => ({
            id: provider.id,
            created: provider.created,
            updated: provider.updated,
            provider: provider.provider,
            platformId: provider.platformId,
        }))

        // TODO (@amrdb) add pagination
        return {
            data: configuredProviders,
            next: null,
            previous: null,
        }
    },

    async create(platformId: PlatformId, request: CreateAIProviderRequest): Promise<ConfiguredAIProvider> {
        const newProvider = {
            id: apId(),
            platformId,
            provider: request.provider,
            apiKey: undefined,
        }

        const savedProvider = await configuredAIProviderRepo().save(newProvider)
        return savedProvider
    },

    async delete(platformId: PlatformId, id: string): Promise<void> {
        await configuredAIProviderRepo().delete({
            id,
            platformId,
        })
    },

    async getApiKey(platformId: PlatformId, provider: string): Promise<string> {
        const configuredProvider = await configuredAIProviderRepo().findOneOrFail({
            where: {
                platformId,
                provider,
            },
        })

        return configuredProvider.apiKey
    },
}

