import { AppSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock } from '../../../database/redis-connections'
import { system } from '../../../helper/system/system'
import { platformPlanService } from './platform-plan.service'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/keys'

export const platformAiCreditsService = (log: FastifyBaseLogger) => ({
    isEnabled(): boolean {
        return !isNil(system.get(AppSystemProp.OPENROUTER_PROVISION_KEY))
    },
    async getUsage(platformId: string): Promise<APIKeyUsage> {
        if (!this.isEnabled()) {
            return {
                usageMonthly: 0,
                limitMonthly: 0,
                limitRemaining: 0,
            }
        }
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (isNil(platformPlan.openRouterApiKey) || isNil(platformPlan.openRouterApiKeyHash)) {
            const limit = ((platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.includedAiCredits)
            return {
                usageMonthly: 0,
                limitMonthly: limit,
                limitRemaining: limit,
            }
        }
        const usage = await openRouterGetKey(platformPlan.openRouterApiKeyHash)
        return {
            usageMonthly: usage.data.usage_monthly * 1000,
            limitMonthly: usage.data.limit * 1000,
            limitRemaining: usage.data.limit_remaining * 1000,
        }
    },
    async provisionKeyIfNeeded(platformId: string): Promise<ProvisionKeyResponse> {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const openRouterApiKey = platformPlan.openRouterApiKey
        const openRouterApiKeyHash = platformPlan.openRouterApiKeyHash
        if (!isNil(openRouterApiKey) && !isNil(openRouterApiKeyHash)) {
            return { key: openRouterApiKey, hash: openRouterApiKeyHash }
        }
        return distributedLock(log).runExclusive({
            key: `platform_ai_credits_${platformId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
                const openRouterApiKey = platformPlan.openRouterApiKey
                const openRouterApiKeyHash = platformPlan.openRouterApiKeyHash
                if (isNil(openRouterApiKey) || isNil(openRouterApiKeyHash)) {
                    const limit = ((platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.includedAiCredits) / 1000
                    const { key, data } = await openRouterCreateKey(`Platform ${platformId}`, limit)
                    await platformPlanService(log).update({
                        platformId,
                        openRouterApiKeyHash: data.hash,
                        openRouterApiKey: key,
                    })
                    return { key, hash: data.hash }
                }
                return { key: openRouterApiKey, hash: openRouterApiKeyHash }
            },
        })
    },
})

async function openRouterCreateKey(name: string, limit: number): Promise<OpenRouterCreateKeyResponse> {
    const apiKey = system.getOrThrow(AppSystemProp.OPENROUTER_PROVISION_KEY)
    const res = await fetch(OPENROUTER_BASE_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            limit,
            limit_reset: 'monthly',
        }),
    })
    if (!res.ok) {
        throw new Error(`Failed to create OpenRouter key: ${res.status} ${await res.text()}`)
    }
    const data = await res.json() as OpenRouterCreateKeyResponse
    return { key: data.key, data: data.data }
}

async function openRouterGetKey(hash: string): Promise<OpenRouterGetKeyResponse> {
    const apiKey = system.getOrThrow(AppSystemProp.OPENROUTER_PROVISION_KEY)
    const res = await fetch(`${OPENROUTER_BASE_URL}/${hash}`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    })
    if (!res.ok) {
        throw new Error(`Failed to get OpenRouter key: ${res.status} ${await res.text()}`)
    }
    const data = await res.json() as OpenRouterGetKeyResponse
    return data
}

type ProvisionKeyResponse = {
    key: string
    hash: string
}

type APIKeyUsage = {
    usageMonthly: number
    limitMonthly: number
    limitRemaining: number
}

// --- OpenRouter Types ---
type OpenRouterCreateKeyResponse = {
    key: string
    data: OpenRouterAPIKeyDataWithHash
}

type OpenRouterGetKeyResponse = {
    data: OpenRouterAPIKeyData
}

type OpenRouterAPIKeyDataWithHash = {
    hash: string
    usage_monthly?: number
    limit?: number
    limit_remaining?: number
}

type OpenRouterAPIKeyData = {
    usage_monthly: number
    limit: number
    limit_remaining: number
}