import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, AiProviderConfig, AiProviderWithoutSensitiveData, ApEdition, apId, ErrorCode, isNil, PlatformId, SeekPage } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { platformUtils } from '../platform/platform.utils'
import { AiProviderEntity, AiProviderSchema } from './ai-provider-entity'

const repo = repoFactory(AiProviderEntity)

export const aiProviderService = {
    async getOrThrow(params: GetParams): Promise<AiProviderConfig> {
        const provider = await repo().findOneBy({
            platformId: params.platformId,
            provider: params.provider,
        })
        if (isNil(provider)) {
            return fallbackToCloudPlatform(params)
        }
        const decryptedConfig = encryptUtils.decryptObject<AiProviderConfig['config']>(provider.config)
        return { ...provider, config: decryptedConfig }
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
        const provider = await repo().findOneByOrFail({ platformId, provider: aiConfig.provider })
        return removeSensitiveData(provider)
    },
    async delete(params: DeleteParams): Promise<void> {
        await this.getOrThrow(params)
        await repo().delete(params)
    },
    async list(platformId: PlatformId): Promise<SeekPage<AiProviderWithoutSensitiveData>> {
        const providers = await repo().findBy({ platformId })
        if (providers.length === 0) {
            const cloudProviders = await fallbackToCloudPlatformList(platformId)
            if (!isNil(cloudProviders)) {
                return cloudProviders
            }
        }
        const data = providers.map((p) => removeSensitiveData(p))
        return {
            data,
            next: null,
            previous: null,
        }
    },
}


// TODO (@abuaboud) clean up this function
async function fallbackToCloudPlatform(params: GetParams): Promise<AiProviderConfig> {
    const isCloudEdition = system.getEdition() === ApEdition.CLOUD
    if (isCloudEdition) {
        const platform = await platformService.getOneOrThrow(params.platformId)
        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        const isEnterpriseCustomer = platformUtils.isEnterpriseCustomerOnCloud(platform)
        if (!isEnterpriseCustomer && cloudPlatformId !== params.platformId) {
            return aiProviderService.getOrThrow({
                platformId: cloudPlatformId,
                provider: params.provider,
            })
        }
    }
    throw new ActivepiecesError({
        code: ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
        params: {
            provider: params.provider,
        },
    })
}

// TODO (@abuaboud) clean up this function
async function fallbackToCloudPlatformList(platformId: PlatformId): Promise<SeekPage<AiProviderWithoutSensitiveData> | null> {
    const isCloudEdition = system.getEdition() === ApEdition.CLOUD
    if (isCloudEdition) {
        const platform = await platformService.getOneOrThrow(platformId)
        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        const isEnterpriseCustomer = platformUtils.isEnterpriseCustomerOnCloud(platform)
        if (!isEnterpriseCustomer && cloudPlatformId !== platformId) {
            return aiProviderService.list(cloudPlatformId)
        }
    }
    return null
}

function removeSensitiveData(provider: AiProviderSchema | AiProviderConfig): AiProviderWithoutSensitiveData {
    return { ...provider, config: {} }
}

type DeleteParams = {
    platformId: PlatformId
    provider: string
}

type GetParams = {
    platformId: PlatformId
    provider: string
}