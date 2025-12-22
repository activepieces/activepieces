import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError, ActivePiecesProviderAuthConfig, AIProviderAuthConfig, AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData,
    apId,
    CreateAIProviderRequest,
    ErrorCode,
    GetProviderConfigResponse,
    isNil,
    PlatformId,
    UpdateAIProviderRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { flagService } from '../flags/flag.service'
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
        const activepiecesExists = await aiProviderRepo().existsBy({
            platformId,
            provider: AIProviderName.ACTIVEPIECES,
        })

        if (flagService.aiCreditsEnabled() && !activepiecesExists) {
            await aiProviderRepo().save({
                id: apId(),
                auth: await encryptUtils.encryptObject({}),
                config: {},
                provider: AIProviderName.ACTIVEPIECES,
                displayName: 'Activepieces',
                platformId,
            })
        }
        const configuredProviders = await aiProviderRepo().findBy({ platformId })

        const formattedProviders: AIProviderWithoutSensitiveData[] = await Promise.all(configuredProviders.map(async p => {
            return {
                id: p.id,
                name: p.displayName,
                provider: p.provider,
                config: p.config,
            }
        }))
        return formattedProviders
    },

    async listModels(platformId: PlatformId, providerId: string): Promise<AIProviderModel[]> {
        const { provider, config, auth } = await this.getConfigOrThrow({ platformId, providerId })

        const cacheKey = `${provider}-${auth.apiKey}`
        if (modelsCache.has(cacheKey) && !('models' in config)) {
            return modelsCache.get(cacheKey)!
        }

        const data = await aiProviders[provider].listModels(auth, config)

        modelsCache.set(cacheKey, data.map(model => ({
            id: model.id,
            name: model.name,
            type: model.type,
        })))

        return modelsCache.get(cacheKey)!
    },

    async create(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        await aiProviderRepo().save({
            id: apId(),
            auth: await encryptUtils.encryptObject(request.auth),
            config: request.config,
            provider: request.provider,
            displayName: request.displayName,
            platformId,
        })
    },
    async update(platformId: PlatformId, providerId: string, request: UpdateAIProviderRequest): Promise<void> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            id: providerId,
        })
        if (isNil(aiProvider) || aiProvider.provider === AIProviderName.ACTIVEPIECES) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: providerId, entityType: 'AIProvider' },
            })
        }

        await aiProviderRepo().upsert({
            id: providerId ?? apId(),
            auth: await encryptUtils.encryptObject(request.auth),
            config: request.config,
            provider: aiProvider.provider,
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
    async getConfigOrThrow({ platformId, providerId }: GetOrCreateActivepiecesConfigResponse): Promise<GetProviderConfigResponse> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            id: providerId,
        })
        if (isNil(aiProvider)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: providerId,
                    entityType: 'AIProvider',
                },
            })
        }
        if (aiProvider.provider === AIProviderName.ACTIVEPIECES) {
            const doesHaveKeys = await doesActivepiecesProviderHasKeys(aiProvider)
            if (!doesHaveKeys) {
                return await enrichWithKeysIfNeeded(aiProvider, platformId, log)
            }
        }
        const auth = await encryptUtils.decryptObject<AIProviderAuthConfig>(aiProvider.auth)
        return { provider: aiProvider.provider, auth, config: aiProvider.config }
    },
    async getActivepiecesProviderIfEnriched(platformId: PlatformId): Promise<GetProviderConfigResponse | null> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            provider: AIProviderName.ACTIVEPIECES,
        })
        if (isNil(aiProvider)) {
            return null
        }
        const doesHaveKeys = await doesActivepiecesProviderHasKeys(aiProvider)
        if (!doesHaveKeys) {
            return null
        }
        return await this.getConfigOrThrow({ platformId, providerId: aiProvider.id })
    },
})

type GetOrCreateActivepiecesConfigResponse = {
    providerId: string
    platformId: PlatformId
}

async function enrichWithKeysIfNeeded(aiProvider: AIProviderSchema, platformId: PlatformId, log: FastifyBaseLogger): Promise<GetProviderConfigResponse> {
    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
    const limit = ((platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.includedAiCredits) / 1000
    const { key, data } = await openRouterCreateKey(`Platform ${platformId}`, limit)
    const rawAuth: ActivePiecesProviderAuthConfig = { apiKey: key, apiKeyHash: data.hash }
    const savedAiProvider = await aiProviderRepo().save({
        id: aiProvider.id,
        platformId,
        provider: AIProviderName.ACTIVEPIECES,
        displayName: 'Activepieces',
        config: {},
        auth: await encryptUtils.encryptObject(rawAuth),
    })
    return { provider: savedAiProvider.provider, auth: rawAuth, config: savedAiProvider.config }
}


async function doesActivepiecesProviderHasKeys(aiProvider: AIProviderSchema): Promise<boolean> {
    if (isNil(aiProvider) || isNil(aiProvider.auth)) {
        return false
    }
    const decryptedAuth = await encryptUtils.decryptObject<ActivePiecesProviderAuthConfig>(aiProvider.auth)
    return !isNil(decryptedAuth) && !isNil(decryptedAuth.apiKey) && decryptedAuth.apiKey !== ''
}

async function openRouterCreateKey(name: string, limit: number): Promise<{ key: string, data: { hash: string } }> {
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

