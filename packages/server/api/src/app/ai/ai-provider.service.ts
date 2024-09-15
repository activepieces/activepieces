import { ActivepiecesError, AiProviderConfig, AiProviderWithoutSensitiveData, apId, ErrorCode, isNil, PlatformId, SeekPage } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { AiProviderEntity, AiProviderSchema } from './ai-provider-entity'

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
    async getSanitizedOrThrow(params: GetParams): Promise<AiProviderWithoutSensitiveData> {
        const provider = await this.getOrThrow(params)
        return { ...provider, config: { defaultHeaders: {} } }
    },
    async upsert(platformId: string, aiConfig: Omit<AiProviderConfig, 'id' | 'created' | 'updated' | 'platformId'>): Promise<AiProviderWithoutSensitiveData> {
        const existingProvider = await this.getOrThrow({ platformId, provider: aiConfig.provider }).catch(() => null)
        const existingHeaders = existingProvider?.config.defaultHeaders ?? {}
        const nonEmptyHeaders = Object.fromEntries(Object.entries(aiConfig.config.defaultHeaders).filter(([_, v]) => !isNil(v)))
        const newHeaders = { ...existingHeaders, ...nonEmptyHeaders }
        const encryptedConfig = encryptUtils.encryptObject({ ...aiConfig.config, defaultHeaders: newHeaders })
        await repo().upsert({
            id: apId(),
            platformId,
            baseUrl: aiConfig.baseUrl,
            config: encryptedConfig,
            provider: aiConfig.provider,
        }, ['platformId', 'provider'])
        return this.getSanitizedOrThrow({ platformId, provider: aiConfig.provider })
    },
    async delete(params: DeleteParams): Promise<void> {
        await this.getOrThrow(params)
        await repo().delete(params)
    },
    async list(platformId: PlatformId): Promise<SeekPage<AiProviderWithoutSensitiveData>> {
        const providers = await repo().findBy({ platformId })
        const data = providers.map(p => {
            return { ...p, config: {} }
        })
        return {
            data,
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