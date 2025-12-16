import { AppSystemProp } from '@activepieces/server-shared'
import { apId, assertNotNullOrUndefined, isNil, PlatformAiCreditsPaymentStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { distributedLock } from '../../../database/redis-connections'
import { system } from '../../../helper/system/system'
import { openRouterApi } from './openrouter/openrouter-api'
import { PlatformAiCreditsPaymentEntity } from './platform-ai-credits-payment.entity'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

const platformAiCreditsPaymentRepo = repoFactory(PlatformAiCreditsPaymentEntity)

const CREDIT_PER_DOLLAR = 1000

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
            return {
                usageMonthly: 0,
                limitMonthly: platformPlan.includedAiCredits,
                limitRemaining: platformPlan.includedAiCredits,
            }
        }

        const { data: usage } = await openRouterApi.getKey({ hash: platformPlan.openRouterApiKeyHash })
        
        return {
            usageMonthly: usage.usage_monthly * CREDIT_PER_DOLLAR,
            limitMonthly: usage.limit! * CREDIT_PER_DOLLAR,
            limitRemaining: usage.limit_remaining! * CREDIT_PER_DOLLAR,
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

                if (!isNil(openRouterApiKey) && !isNil(openRouterApiKeyHash)) {
                    return { key: openRouterApiKey, hash: openRouterApiKeyHash }
                }

                const limit = (platformPlan.includedAiCredits / CREDIT_PER_DOLLAR)
                const { key, data } = await openRouterApi.createKey({ 
                    name: `Platform ${platformId}`,
                    limit,
                })
                await platformPlanService(log).update({
                    platformId,
                    openRouterApiKeyHash: data.hash,
                    openRouterApiKey: key,
                })
                return { key, hash: data.hash }
            },
        })
    },

    async initializeAiCreditsPayment(platformId: string, totalCredits: number): Promise<{ stripeCheckoutUrl: string }> {
        const { stripeCustomerId: customerId } = await platformPlanService(log).getOrCreateForPlatform(platformId)
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const amountInUsd = totalCredits / CREDIT_PER_DOLLAR

        const id = apId()
        await platformAiCreditsPaymentRepo().insert({
            id,
            platformId,
            aiCredits: totalCredits,
            amount: amountInUsd,
            status: PlatformAiCreditsPaymentStatus.PAYMENT_PENDING,
        })

        const stripeCheckoutUrl = await stripeHelper(log).createNewAICreditPaymentCheckoutSession({
            aiCredits: totalCredits,
            platformId,
            paymentId: id,
            customerId,
        })

        return { stripeCheckoutUrl }
    },

    async aiCreditsPaymentSucceeded(paymentId: string, txId: string): Promise<void> {
        const payment = await platformAiCreditsPaymentRepo().findOneOrFail({ where: { id: paymentId } })
        if (payment.status === PlatformAiCreditsPaymentStatus.DONE) {
            return
        }

        await platformAiCreditsPaymentRepo().save({ id: paymentId, txId, status: PlatformAiCreditsPaymentStatus.PAYMENT_SUCCESS })

        const { hash } = await this.provisionKeyIfNeeded(payment.platformId)
        const { data: key } = await openRouterApi.getKey({ hash })

        await openRouterApi.updateKey({
            hash,
            limit: key.limit! + payment.amount,
        })

        await platformAiCreditsPaymentRepo().save({ id: paymentId, status: PlatformAiCreditsPaymentStatus.DONE })
    },

    async aiCreditsPaymentFailed(paymentId: string): Promise<void> {
        await platformAiCreditsPaymentRepo().save({ id: paymentId, status: PlatformAiCreditsPaymentStatus.PAYMENT_FAILED })
    },

    async resetPlanIncludedCredits(platformId: string): Promise<void> {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const { hash } = await this.provisionKeyIfNeeded(platformId)
        const { data: key } = await openRouterApi.getKey({ hash })

        let creditsToAdd: number
        const creditsUsedLastMonth = key.usage_monthly * CREDIT_PER_DOLLAR
         
        if (creditsUsedLastMonth > platformPlan.includedAiCredits) {
            creditsToAdd = platformPlan.includedAiCredits
        }
        else {
            creditsToAdd = platformPlan.includedAiCredits - creditsUsedLastMonth
        }

        const amount = creditsToAdd / CREDIT_PER_DOLLAR

        await openRouterApi.updateKey({
            hash,
            limit: key.limit! + amount,
        })
    },
})


type ProvisionKeyResponse = {
    key: string
    hash: string
}

type APIKeyUsage = {
    usageMonthly: number
    limitMonthly: number
    limitRemaining: number
}
