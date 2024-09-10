import { ActivepiecesError, AiProviderConfig, AiProviderWithoutSensitiveData, apId, ErrorCode, isNil, PlatformId, SeekPage } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { AiProviderEntity } from './ai-provider-entity'

const repo = repoFactory(AiProviderEntity)

export const aiProviderService = {
    async getOrThrow(params: GetParams): Promise<AiProviderConfig> {
        const provider = await repo().findOneBy(params)
        if (isNil(provider)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `${params.platformId}-${params.provider}`,
                    entityType: 'proxy_config',
                },
            })
        }
        const decryptedConfig = encryptUtils.decryptObject<AiProviderConfig['config']>(provider.config)
        return { ...provider, config: decryptedConfig }
    },
    async upsert(platformId: string, aiConfig: Omit<AiProviderConfig, 'id' | 'created' | 'updated' | 'platformId'>): Promise<AiProviderConfig> {
        const encryptedConfig = encryptUtils.encryptObject(aiConfig.config)
        await repo().upsert({
            id: apId(),
            platformId,
            baseUrl: aiConfig.baseUrl,
            config: encryptedConfig,
            provider: aiConfig.provider,
        }, ['platformId', 'provider'])
        return this.getOrThrow({ platformId, provider: aiConfig.provider })
    },
    async delete(params: DeleteParams): Promise<void> {
        await this.getOrThrow(params)
        await repo().delete(params)
    },
    async list(platformId: PlatformId): Promise<SeekPage<AiProviderWithoutSensitiveData>> {
        const providers = await repo().findBy({ platformId })
        return {
            data: providers,
            next: null,
            previous: null,
        }
    },
}

type DeleteParams = {
    platformId: PlatformId
    provider: string
}

type GetParams = {
    platformId: PlatformId
    provider: string
}