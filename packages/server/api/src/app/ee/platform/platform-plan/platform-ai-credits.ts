import { AppSystemProp } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { platformPlanService } from './platform-plan.service'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/keys'

export const platformAiCreditsService = (log: FastifyBaseLogger) => ({
    async isEnabled(): Promise<boolean> {
        return !isNil(system.get(AppSystemProp.OPENROUTER_PROVISION_KEY))
    },
    async getUsage(platformId: string): Promise<APIKeyUsage> {
        const response = await platformAiCreditsService(log).provisionKeyIfNeeded(platformId)
        const usage = await openRouterGetKey(response.hash)
        assertNotNullOrUndefined(usage.data.usageMonthly, 'Usage monthly is not set')
        assertNotNullOrUndefined(usage.data.limit, 'Limit is not set')
        assertNotNullOrUndefined(usage.data.limitRemaining, 'Limit remaining is not set')
        return {
            usageMonthly: usage.data.usageMonthly * 1000,
            limitMonthly: usage.data.limit * 1000,
            limitRemaining: usage.data.limitRemaining * 1000,
        }
    },
    async provisionKeyIfNeeded(platformId: string): Promise<ProvisionKeyResponse> {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const openRouterApiKey = platformPlan.openRouterApiKey
        const openRouterApiKeyHash = platformPlan.openRouterApiKeyHash
        if (isNil(openRouterApiKey) || isNil(openRouterApiKeyHash)) {
            const limit = (platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.includedAiCredits
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
    const data = await res.json() as OpenRouterAPIKeyData
    return { data }
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
    usageMonthly?: number
    limit?: number
    limitRemaining?: number
}

type OpenRouterAPIKeyData = {
    usageMonthly: number
    limit: number
    limitRemaining: number
}