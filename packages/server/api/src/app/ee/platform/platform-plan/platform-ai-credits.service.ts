import { CreateAICreditCheckoutSessionParamsSchema, UpdateAICreditsAutoTopUpParamsSchema } from '@activepieces/ee-shared'
import { exceptionHandler, sleep } from '@activepieces/server-shared'
import { AiCreditsAutoTopUpState, assertNotNullOrUndefined, isNil, PlatformPlan, tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../../ai/ai-provider-service'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { flagService } from '../../../flags/flag.service'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { openRouterApi, OpenRouterApikey } from './openrouter/openrouter-api'
import { platformPlanService } from './platform-plan.service'
import { StripeCheckoutType, stripeHelper } from './stripe-helper'

const CREDIT_PER_DOLLAR = 1000
const USAGE_CACHE_TTL_SECONDS = 180

export const platformAiCreditsService = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        systemJobHandlers.registerJobHandler(SystemJobName.AI_CREDIT_UPDATE_CHECK, async ({ apiKeyHash, platformId }) => {
            log.info('(platformAiCreditsService) AI credit update check')
            try {
                await distributedLock(log).runExclusive({
                    key: `ai_credits_update_${platformId}`,
                    timeoutInSeconds: 100,
                    fn: async () => {
                        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)

                        await tryResetPlanIncludedCredits(plan, apiKeyHash, log)
                        const autoToppedUp = await tryAutoTopUpPlan(plan, apiKeyHash, log)

                        if (autoToppedUp) {
                            await sleep(30000) // 30 seconds to wait for stripe to complete
                        }
                    },
                })
            }
            catch (e) {
                log.error(e, '(platformAiCreditsService) AI credit update check failed')
                throw e
            }
        })
    },

    isEnabled(): boolean {
        return flagService.aiCreditsEnabled()
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

async function tryResetPlanIncludedCredits(plan: PlatformPlan, apiKeyHash: string, log: FastifyBaseLogger): Promise<void> {
    if (dayjs().diff(plan.lastFreeAiCreditsRenewalDate, 'month') < 1) {
        return
    }

    const { data: key } = await openRouterApi.getKey({ hash: apiKeyHash })

    const amount = plan.includedAiCredits / CREDIT_PER_DOLLAR

    await openRouterApi.updateKey({
        hash: apiKeyHash,
        limit: key.limit! + amount,
    })

    await platformPlanService(log).update({
        platformId: plan.platformId,
        lastFreeAiCreditsRenewalDate: new Date().toISOString(),
    })
}

async function tryAutoTopUpPlan(plan: PlatformPlan, apiKeyHash: string, log: FastifyBaseLogger): Promise<boolean> {
    if (plan.aiCreditsAutoTopUpState !== AiCreditsAutoTopUpState.ENABLED) {
        return false
    }

    assertNotNullOrUndefined(plan.stripeCustomerId, 'Stripe customer id is not set')
    assertNotNullOrUndefined(plan.aiCreditsAutoTopUpCreditsToAdd, 'Auto Topup Credits To add is not set')
    assertNotNullOrUndefined(plan.aiCreditsAutoTopUpThreshold, 'Auto Topup Threashold is not set')

    const { data: key } = await openRouterApi.getKey({ hash: apiKeyHash })

    const creditsRemaining = key.limit_remaining! * CREDIT_PER_DOLLAR
    if (creditsRemaining > plan.aiCreditsAutoTopUpThreshold) {
        return false
    }


    if (!isNil(plan.maxAutoTopUpCreditsMonthly) && plan.maxAutoTopUpCreditsMonthly > 0) {
        const totalAmountThisMonth = await stripeHelper(log).getAutoTopUpInvoicesTotalThisMonth(plan.stripeCustomerId, plan.platformId)
        const totalCreditsThisMonth = totalAmountThisMonth * CREDIT_PER_DOLLAR

        const autoTopUpCreditsThisMonthAfterThisTopUp = totalCreditsThisMonth + plan.aiCreditsAutoTopUpCreditsToAdd

        if (autoTopUpCreditsThisMonthAfterThisTopUp > plan.maxAutoTopUpCreditsMonthly) {
            log.info({
                platformId: plan.platformId,
                totalCreditsThisMonth,
                creditsToAdd: plan.aiCreditsAutoTopUpCreditsToAdd,
                maxMonthlyLimit: plan.maxAutoTopUpCreditsMonthly,
            }, '(tryAutoTopUpPlan) AI credit auto top-up limit reached this month')
            return false
        }
    }

    const paymentMethod = await stripeHelper(log).getPaymentMethod(plan.stripeCustomerId)

    assertNotNullOrUndefined(paymentMethod, 'Auto Topup Stripe payment method is not set')

    const amountInUsd = plan.aiCreditsAutoTopUpCreditsToAdd / CREDIT_PER_DOLLAR

    await stripeHelper(log).createNewAICreditAutoTopUpInvoice({
        amountInUsd,
        customerId: plan.stripeCustomerId,
        paymentMethod,
        platformId: plan.platformId,
    })

    return true
}

type APIKeyUsage = {
    limit: number
    usage: number
    usageMonthly: number
    usageRemaining: number
}
