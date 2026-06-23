import { assertNotNullOrUndefined, isNil, tryCatch } from '@activepieces/core-utils'
import { AiCreditsAutoTopUpState, CreateAICreditCheckoutSessionParamsSchema, UpdateAICreditsAutoTopUpParamsSchema } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../../ai/ai-provider-service'
import { distributedStore } from '../../../database/redis-connections'
import { flagService } from '../../../flags/flag.service'
import { exceptionHandler } from '../../../helper/exception-handler'
import { openRouterApi, OpenRouterApikey } from './openrouter/openrouter-api'
import { platformPlanService } from './platform-plan.service'
import { StripeCheckoutType, stripeHelper } from './stripe-helper'

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
                limit: platformPlan.includedAiCredits,
                usageMonthly: 0,
                usageRemaining: platformPlan.includedAiCredits,
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

    async updateAutoTopUp(platformId: string, request: UpdateAICreditsAutoTopUpParamsSchema): Promise<{ stripeCheckoutUrl?: string }> {
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)

        if (request.state === AiCreditsAutoTopUpState.DISABLED) {
            await platformPlanService(log).update({
                platformId,
                aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.DISABLED,
            })
            return {}
        }

        await platformPlanService(log).update({
            platformId,
            aiCreditsAutoTopUpCreditsToAdd: request.creditsToAdd,
            aiCreditsAutoTopUpThreshold: request.minThreshold,
            maxAutoTopUpCreditsMonthly: request.maxMonthlyLimit,
        })

        assertNotNullOrUndefined(plan.stripeCustomerId, 'Stripe customer id is not set')
        const paymentMethod = await stripeHelper(log).getPaymentMethod(plan.stripeCustomerId)
        if (!isNil(paymentMethod)) {
            await platformPlanService(log).update({
                platformId,
                aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.ENABLED,
            })

            return {}
        }

        const stripeCheckoutUrl = await stripeHelper(log).createNewAICreditAutoTopUpCheckoutSession({
            platformId,
            customerId: plan.stripeCustomerId,
        })

        await platformPlanService(log).update({
            platformId,
            aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.DISABLED,
        })

        return { stripeCheckoutUrl }
    },

    async handleAutoTopUpCheckoutSessionCompleted(platformId: string, paymentMethodId: string): Promise<void> {
        await platformPlanService(log).update({
            platformId,
            aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.ENABLED,
        })

        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        assertNotNullOrUndefined(plan.stripeCustomerId, 'Stripe customer id is not set')

        await stripeHelper(log).attachPaymentMethodToCustomer(paymentMethodId, plan.stripeCustomerId)
    },

    async initializeStripeAiCreditsPayment(platformId: string, { aiCredits }: CreateAICreditCheckoutSessionParamsSchema): Promise<{ stripeCheckoutUrl: string }> {
        const { stripeCustomerId: customerId } = await platformPlanService(log).getOrCreateForPlatform(platformId)
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const amountInUsd = aiCredits / CREDIT_PER_DOLLAR

        const stripeCheckoutUrl = await stripeHelper(log).createNewAICreditPaymentCheckoutSession({
            amountInUsd,
            platformId,
            customerId,
        })
        return { stripeCheckoutUrl }
    },

    async aiCreditsPaymentSucceeded(platformId: string, amount: number, _paymentType: StripeCheckoutType): Promise<void> {
        const { apiKeyHash } = await aiProviderService(log).getOrCreateActivePiecesProviderAuthConfig(platformId)
        const { data: key } = await openRouterApi.getKey({ hash: apiKeyHash })

        await openRouterApi.updateKey({
            hash: apiKeyHash,
            limit: key.limit! + amount,
        })
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
