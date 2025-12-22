import { CreateAICreditCheckoutSessionParamsSchema, EnableAICreditsAutoTopUpParamsSchema, ListAICreditsPaymentsRequestParams } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, AiCreditsAutoTopUpState, apId, assertNotNullOrUndefined, ErrorCode, isNil, PlatformAiCreditsPayment, PlatformAiCreditsPaymentStatus, PlatformAiCreditsPaymentType, PlatformPlan, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { distributedLock } from '../../../database/redis-connections'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import Paginator from '../../../helper/pagination/paginator'
import { system } from '../../../helper/system/system'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { openRouterApi } from './openrouter/openrouter-api'
import { PlatformAiCreditsPaymentEntity } from './platform-ai-credits-payment.entity'
import { platformPlanRepo, platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

const platformAiCreditsPaymentRepo = repoFactory(PlatformAiCreditsPaymentEntity)

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
            }
        })
        systemJobHandlers.registerJobHandler(SystemJobName.AI_CREDIT_AUTO_TOPUP, async () => {
            log.info('(platformAiCreditsService) Auto Topup AI credits')
            try {
                await this.autoTopUpPlans()
            }
            catch (e) {
                log.error(e, '(platformAiCreditsService) Auto Topup AI credits failed')
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
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.AI_CREDIT_AUTO_TOPUP,
                data: {},
            },
            schedule: {
                type: 'repeated',
                cron: '0 */6 * * *', // every 6 hours
            },
        })
    },

    isEnabled(): boolean {
        return !isNil(system.get(AppSystemProp.OPENROUTER_PROVISION_KEY))
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

        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (isNil(platformPlan.openRouterApiKey) || isNil(platformPlan.openRouterApiKeyHash)) {
            return {
                usage: 0,
                limit: 0,
                usageMonthly: 0,
                usageRemaining: 0,
            }
        }

        const { data: usage } = await openRouterApi.getKey({ hash: platformPlan.openRouterApiKeyHash })

        return {
            usageMonthly: usage.usage_monthly * CREDIT_PER_DOLLAR,
            usageRemaining: usage.limit_remaining! * CREDIT_PER_DOLLAR,
            usage: usage.usage * CREDIT_PER_DOLLAR,
            limit: usage.limit! * CREDIT_PER_DOLLAR,
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

    async listPayments(platformId: string, params: ListAICreditsPaymentsRequestParams): Promise<SeekPage<PlatformAiCreditsPayment>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor)
        const paginator = buildPaginator({
            entity: PlatformAiCreditsPaymentEntity,
            alias: 'ac',
            query: {
                limit: params.limit ?? Paginator.NO_LIMIT,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryBuilder = platformAiCreditsPaymentRepo()
            .createQueryBuilder('ac')
            .where('ac."platformId" = :platformId', { platformId })
            .orderBy('ac."created"', 'DESC')

        const result = await paginator.paginate(queryBuilder)

        return paginationHelper.createPage(result.data, result.cursor)
    },

    async initializeStripeAiCreditsPayment(platformId: string, { aiCredits }: CreateAICreditCheckoutSessionParamsSchema): Promise<{ stripeCheckoutUrl: string }> {
        const { stripeCustomerId: customerId } = await platformPlanService(log).getOrCreateForPlatform(platformId)
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const amountInUsd = aiCredits / CREDIT_PER_DOLLAR

        const id = apId()

        const stripeCheckoutUrl = await stripeHelper(log).createNewAICreditPaymentCheckoutSession({
            amountInUsd,
            platformId,
            paymentId: id,
            customerId,
        })

        await platformAiCreditsPaymentRepo().insert({
            id,
            platformId,
            aiCredits,
            amount: amountInUsd,
            type: PlatformAiCreditsPaymentType.MANUAL,
            status: PlatformAiCreditsPaymentStatus.PAYMENT_PENDING,
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

    async resetPlanIncludedCredits(): Promise<void> {
        const keys: Awaited<ReturnType<typeof openRouterApi.listKeys>>['data'] = []
        let offset = 0
        while (true) {
            const { data } = await openRouterApi.listKeys({ offset })
            if (data.length === 0) break

            keys.push(...data)
            offset += data.length
        }

        const plans = await platformPlanRepo().find({
            where: { openRouterApiKeyHash: In(keys.map(k => k.hash)) },
        })

        for (const plan of plans) {
            const key = keys.find(k => k.hash === plan.openRouterApiKeyHash)
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
                hash: key.hash,
                limit: key.limit! + amount,
            })
        }
    },

    async autoTopUpPlans(): Promise<void> {
        const keys: Awaited<ReturnType<typeof openRouterApi.listKeys>>['data'] = []
        let offset = 0
        while (true) {
            const { data } = await openRouterApi.listKeys({ offset })
            if (data.length === 0) break

            keys.push(...data)
            offset += data.length
        }

        const plans = await platformPlanRepo().find({
            where: { 
                openRouterApiKeyHash: In(keys.map(k => k.hash)), 
                aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.ALLOWED_AND_ON, 
            },
        })

        for (const plan of plans) {
            const key = keys.find(k => k.hash === plan.openRouterApiKeyHash)
            if (!key) continue

            const creditsRemaining = key.limit_remaining! * CREDIT_PER_DOLLAR

            if (creditsRemaining <= plan.aiCreditsAutoTopUpThreshold!) {
                await this.autoTopUpPlan(plan)
            }
        }
    },

    async autoTopUpPlan(plan: PlatformPlan): Promise<void> {
        if (plan.aiCreditsAutoTopUpState !== AiCreditsAutoTopUpState.ALLOWED_AND_ON) {
            return
        }

        assertNotNullOrUndefined(plan.stripeCustomerId, 'Stripe customer id is not set')
        assertNotNullOrUndefined(plan.aiCreditsAutoTopUpStripePaymentMethod, 'Auto Topup Stripe payment method is not set')
        assertNotNullOrUndefined(plan.aiCreditsAutoTopUpCreditsToAdd, 'Auto Topup Credits To add is not set')
        assertNotNullOrUndefined(plan.aiCreditsAutoTopUpThreshold, 'Auto Topup Threashold is not set')

        const amountInUsd = plan.aiCreditsAutoTopUpCreditsToAdd / CREDIT_PER_DOLLAR

        const id = apId()
        const txId = await stripeHelper(log).createNewAICreditAutoTopUpPaymentIntent({
            amountInUsd,
            paymentId: id,
            customerId: plan.stripeCustomerId,
            paymentMethod: plan.aiCreditsAutoTopUpStripePaymentMethod,
            platformId: plan.platformId,
        })
        
        await platformAiCreditsPaymentRepo().insert({
            id,
            platformId: plan.platformId,
            aiCredits: plan.aiCreditsAutoTopUpCreditsToAdd,
            amount: amountInUsd,
            txId,
            type: PlatformAiCreditsPaymentType.AUTO_TOPUP,
            status: PlatformAiCreditsPaymentStatus.PAYMENT_PENDING,
        })
    },
})


type ProvisionKeyResponse = {
    key: string
    hash: string
}

type APIKeyUsage = {
    limit: number
    usage: number
    usageMonthly: number
    usageRemaining: number
}
