import { assertNotNullOrUndefined, isNil, tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../../ai/ai-provider-service'
import { distributedStore } from '../../../database/redis-connections'
import { flagService } from '../../../flags/flag.service'
import { exceptionHandler } from '../../../helper/exception-handler'
import { openRouterApi, OpenRouterApikey } from './openrouter/openrouter-api'
import { platformPlanService } from './platform-plan.service'

const CREDIT_PER_DOLLAR = 1000
const USAGE_CACHE_TTL_SECONDS = 180

export const platformAiCreditsService = (log: FastifyBaseLogger) => ({
    isEnabled(): boolean {
        return flagService(log).aiCreditsEnabled()
    },

    async getUsage(platformId: string): Promise<APIKeyUsage> {
        if (!this.isEnabled()) {
            return {
                usage: 0,
                limit: 0,
                usageMonthly: 0,
                usageRemaining: 0,
            }
        }

        const auth = await aiProviderService(log).getActivepiecesProviderIfEnriched(platformId)
        if (isNil(auth)) {
            const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)

            return {
                usage: 0,
                limit: platformPlan.includedCredits,
                usageMonthly: 0,
                usageRemaining: platformPlan.includedCredits,
            }
        }

        assertNotNullOrUndefined(auth.apiKeyHash, 'apiKeyHash is required')

        const usage = await getOpenRouterUsageCached(auth.apiKeyHash, log)

        return {
            usageMonthly: usage.usage_monthly * CREDIT_PER_DOLLAR,
            usageRemaining: usage.limit_remaining! * CREDIT_PER_DOLLAR,
            usage: usage.usage * CREDIT_PER_DOLLAR,
            limit: usage.limit! * CREDIT_PER_DOLLAR,
        }
    },

})

async function getOpenRouterUsageCached(apiKeyHash: string, log: FastifyBaseLogger): Promise<Pick<OpenRouterApikey, 'usage' | 'limit' | 'limit_remaining' | 'usage_monthly'>> {
    const cacheKey = `openrouter_usage_${apiKeyHash}`

    const cachedUsage = await distributedStore.get<OpenRouterApikey>(cacheKey)
    if (!isNil(cachedUsage)) {
        return cachedUsage
    }

    const { error, data: usage } = await tryCatch(async () => openRouterApi.getKey({ hash: apiKeyHash }))
    if (!isNil(error) || isNil(usage)) {
        exceptionHandler.handle(error, log)
        return {
            limit: 0,
            limit_remaining: 0,
            usage: 0,
            usage_monthly: 0,
        }
    }
    const value = {
        limit: usage.data.limit ?? 0,
        limit_remaining: usage.data.limit_remaining ?? 0,
        usage: usage.data.usage ?? 0,
        usage_monthly: usage.data.usage_monthly ?? 0,
    }
    await distributedStore.put(cacheKey, value, USAGE_CACHE_TTL_SECONDS)
    return value
}

type APIKeyUsage = {
    limit: number
    usage: number
    usageMonthly: number
    usageRemaining: number
}
