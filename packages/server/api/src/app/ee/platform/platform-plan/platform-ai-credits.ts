import { AppSystemProp } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { aiProviderService } from '../../../ai/ai-provider-service'
import { flagService } from '../../../flags/flag.service'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/keys'

export const platformAiCreditsService = (log: FastifyBaseLogger) => ({
    isEnabled(): boolean {
        return flagService.aiCreditsEnabled()
    },
    async getUsage(platformId: string): Promise<APIKeyUsage> {
        if (!this.isEnabled()) {
            return {
                usageMonthly: 0,
                limitMonthly: 0,
                limitRemaining: 0,
            }
        }

        const config = await 

        const usage = await openRouterGetKey(config.apiKeyHash)
        return {
            usageMonthly: usage.data.usage_monthly * 1000,
            limitMonthly: usage.data.limit * 1000,
            limitRemaining: usage.data.limit_remaining * 1000,
        }
    },
})

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

type APIKeyUsage = {
    usageMonthly: number
    limitMonthly: number
    limitRemaining: number
}

// --- OpenRouter Types ---
type OpenRouterGetKeyResponse = {
    data: OpenRouterAPIKeyData
}

type OpenRouterAPIKeyData = {
    usage_monthly: number
    limit: number
    limit_remaining: number
}