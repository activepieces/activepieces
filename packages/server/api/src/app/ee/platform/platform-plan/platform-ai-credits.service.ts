import { CreateAICreditCheckoutSessionParamsSchema, EnableAICreditsAutoTopUpParamsSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, AiCreditsAutoTopUpState, assertNotNullOrUndefined, ErrorCode, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { aiProviderService } from '../../../ai/ai-provider-service'
import { redisConnections } from '../../../database/redis-connections'
import { flagService } from '../../../flags/flag.service'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { openRouterApi, OpenRouterApikey } from './openrouter/openrouter-api'
import { platformPlanRepo, platformPlanService } from './platform-plan.service'
import { StripeCheckoutType, stripeHelper } from './stripe-helper'

const CREDIT_PER_DOLLAR = 1000

export const platformAiCreditsService = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        systemJobHandlers.registerJobHandler(SystemJobName.AI_CREDIT_RENEW, async () => {
            log.info('(platformAiCreditsService) Renewing Free AI credits')
            try {
                await this.resetPlanIncludedCredits()
            }
            catch (e) {
                log.error(e, '(platformAiCreditsService) Renewing Free AI credits failed')
                throw e
            }
        })
        systemJobHandlers.registerJobHandler(SystemJobName.AI_CREDIT_AUTO_TOPUP, async ({ apiKeyHash, platformId }) => {
            log.info('(platformAiCreditsService) Auto Topup AI credits')
            try {
                await this.tryAutoTopUpPlan(platformId, apiKeyHash)   
            }
            catch (e) {
                log.error(e, '(platformAiCreditsService) Auto Topup AI credits failed')
                throw e
            }
        })

        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.AI_CREDIT_RENEW,
                data: {},
            },
            schedule: {
                type: 'repeated',
                cron: '0 12 L * *', // last day of every month
            },
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

        const { data: usage } = await openRouterApi.getKey({ hash: auth.apiKeyHash })

        return {
            usageMonthly: usage.usage_monthly * CREDIT_PER_DOLLAR,
            usageRemaining: usage.limit_remaining! * CREDIT_PER_DOLLAR,
            usage: usage.usage * CREDIT_PER_DOLLAR,
            limit: usage.limit! * CREDIT_PER_DOLLAR,
        }
    },

    async enableAutoTopUp(platformId: string, request: EnableAICreditsAutoTopUpParamsSchema): Promise<{ stripeCheckoutUrl?: string }> {
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)

        if (plan.aiCreditsAutoTopUpState === AiCreditsAutoTopUpState.ALLOWED_AND_ON) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'auto topup already enabled',
                },
            })
        }

        await platformPlanService(log).update({
            platformId,
            aiCreditsAutoTopUpCreditsToAdd: request.creditsToAdd,
            aiCreditsAutoTopUpThreshold: request.minThreshold,
        })

        if (!isNil(plan.aiCreditsAutoTopUpStripePaymentMethod)) {
            await platformPlanService(log).update({
                platformId,
                aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.ALLOWED_AND_ON,
            })
            return {}
        }

        assertNotNullOrUndefined(plan.stripeCustomerId, 'Stripe customer id is not set')
        const stripeCheckoutUrl = await stripeHelper(log).createNewAICreditAutoTopUpCheckoutSession({
            platformId,
            customerId: plan.stripeCustomerId,
        })

        return { stripeCheckoutUrl }
    },

    async handleAutoTopUpCheckoutSessionCompleted(platformId: string, paymentMethodId: string): Promise<void> {
        await platformPlanService(log).update({
            platformId,
            aiCreditsAutoTopUpStripePaymentMethod: paymentMethodId,
            aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.ALLOWED_AND_ON,
        })
    },

    async updateAutoTopUpConfig(platformId: string, request: EnableAICreditsAutoTopUpParamsSchema): Promise<void> {
        await platformPlanService(log).update({
            platformId,
            aiCreditsAutoTopUpCreditsToAdd: request.creditsToAdd,
            aiCreditsAutoTopUpThreshold: request.minThreshold,
            aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.ALLOWED_AND_ON,
        })
    },

    async disableAutoTopUp(platformId: string): Promise<void> {
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (plan.aiCreditsAutoTopUpState === AiCreditsAutoTopUpState.ALLOWED_BUT_OFF) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'auto topup already disabled',
                },
            })
        }

        await platformPlanService(log).update({
            platformId,
            aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.ALLOWED_BUT_OFF,
        })
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

    async aiCreditsPaymentSucceeded(platformId: string, amount: number, paymentType: StripeCheckoutType): Promise<void> {
        const { apiKeyHash } = await aiProviderService(log).getOrCreateActivePiecesProviderAuthConfig(platformId)
        const { data: key } = await openRouterApi.getKey({ hash: apiKeyHash })

        await openRouterApi.updateKey({
            hash: apiKeyHash,
            limit: key.limit! + amount,
        })

        if (paymentType === StripeCheckoutType.AI_CREDIT_AUTO_TOP_UP) {
            const redis = await redisConnections.useExisting()

            await redis.del(autoTopUpPlatformKey(platformId))
        }
    },

    async resetPlanIncludedCredits(): Promise<void> {
        const keys: OpenRouterApikey[] = []
        let offset = 0
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { data } = await openRouterApi.listKeys({ offset })
            if (data.length === 0) break

            keys.push(...data)
            offset += data.length
        }

        const configs = await aiProviderService(log).getAllActivePiecesProvidersConfigs()

        const platformIds = Object.keys(configs)
        if (platformIds.length === 0) return

        const plans = await platformPlanRepo().find({
            where: { platformId: In(platformIds) },
        })

        for (const plan of plans) {
            const { apiKeyHash } = configs[plan.platformId]

            const key = keys.find(k => k.hash === apiKeyHash)
            if (!key) continue

            let creditsToAdd: number
            const creditsUsedLastMonth = key.usage_monthly * CREDIT_PER_DOLLAR

            if (creditsUsedLastMonth > plan.includedAiCredits) {
                creditsToAdd = plan.includedAiCredits
            }
            else {
                creditsToAdd = plan.includedAiCredits - creditsUsedLastMonth
            }

            const amount = creditsToAdd / CREDIT_PER_DOLLAR

            await openRouterApi.updateKey({
                hash: apiKeyHash,
                limit: key.limit! + amount,
            })
        }
    },

    async tryAutoTopUpPlan(platformId: string, apiKeyHash: string): Promise<void> {
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)

        if (plan.aiCreditsAutoTopUpState !== AiCreditsAutoTopUpState.ALLOWED_AND_ON) {
            return
        }

        const redis = await redisConnections.useExisting()

        const lockKey = autoTopUpPlatformKey(plan.platformId)
        const lockAcquired = await redis.set(lockKey, '1', 'EX', 10, 'NX')
        if (!lockAcquired) { // means there is already a topup operation on this platform
            return
        }

        const { data: key } = await openRouterApi.getKey({ hash: apiKeyHash })

        const creditsRemaining = key.limit_remaining! * CREDIT_PER_DOLLAR
        if (creditsRemaining > plan.aiCreditsAutoTopUpThreshold!) {
            return
        }

        assertNotNullOrUndefined(plan.stripeCustomerId, 'Stripe customer id is not set')
        assertNotNullOrUndefined(plan.aiCreditsAutoTopUpStripePaymentMethod, 'Auto Topup Stripe payment method is not set')
        assertNotNullOrUndefined(plan.aiCreditsAutoTopUpCreditsToAdd, 'Auto Topup Credits To add is not set')
        assertNotNullOrUndefined(plan.aiCreditsAutoTopUpThreshold, 'Auto Topup Threashold is not set')

        const amountInUsd = plan.aiCreditsAutoTopUpCreditsToAdd / CREDIT_PER_DOLLAR

        await stripeHelper(log).createNewAICreditAutoTopUpPaymentIntent({
            amountInUsd,
            customerId: plan.stripeCustomerId,
            paymentMethod: plan.aiCreditsAutoTopUpStripePaymentMethod,
            platformId: plan.platformId,
        })
    },
})

const autoTopUpPlatformKey = (platformId: string) => `auto_topup:${platformId}`

type APIKeyUsage = {
    limit: number
    usage: number
    usageMonthly: number
    usageRemaining: number
}
