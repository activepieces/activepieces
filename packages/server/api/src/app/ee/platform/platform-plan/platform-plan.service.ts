import { ApSubscriptionStatus, BUSINESS_CLOUD_PLAN, checkCanDowngrade, FREE_CLOUD_PLAN, OPENSOURCE_PLAN, PlanName, PLUS_CLOUD_PLAN, UpdateSubscriptionParams } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ApEnvironment, apId, assertNotNullOrUndefined, ErrorCode, isNil, PlatformPlan, PlatformPlanLimits, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'

import { repoFactory } from '../../../core/db/repo-factory'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { platformUsageService } from '../platform-usage-service'
import { PlatformPlanEntity } from './platform-plan.entity'
import { stripeHelper } from './stripe-helper'

export const platformPlanRepo = repoFactory(PlatformPlanEntity)

type UpdatePlatformBillingParams = {
    platformId: string
} & Partial<PlatformPlanLimits>


const edition = system.getEdition()

function getPlanLimits(planName: PlanName.PLUS | PlanName.BUSINESS | PlanName.FREE): Partial<PlatformPlanLimits> {
    switch (planName) {
        case PlanName.FREE:
            return FREE_CLOUD_PLAN
        case PlanName.PLUS:
            return PLUS_CLOUD_PLAN
        case PlanName.BUSINESS:
            return BUSINESS_CLOUD_PLAN
        default:
            throw new Error(`Invalid plan name: ${planName}`)
    }
}

export const platformPlanService = (log: FastifyBaseLogger) => ({
    async getOrCreateForPlatform(platformId: string): Promise<PlatformPlan> {
        const platformPlan = await platformPlanRepo().findOneBy({ platformId })

        if (isNil(platformPlan)) {
            return createInitialBilling(platformId, log)
        }

        return platformPlan
    },


    async handleDowngrade(platformPlan: PlatformPlan, params: UpdateSubscriptionParams): Promise<PlatformPlan> {
        const { plan } = params

        const currentPlatformUsage = await platformUsageService(log).getPlatformUsage(platformPlan.platformId)
        const { canDowngrade, metrics } = checkCanDowngrade(platformPlanService(log).getPlanLimits(plan), currentPlatformUsage)

        if (!canDowngrade) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED_DOWNGRADE,
                params: {
                    metrics,
                },
            })
        }

        assertNotNullOrUndefined(platformPlan.stripeSubscriptionId, 'Stripe subscription id is not set')
        await stripeHelper(log).updateSubscription(
            platformPlan.stripeSubscriptionId,
            { plan },
        )

        log.info(`${plan} subscription updated for platform ${platformPlan.platformId}`)
        const planLimits = platformPlanService(log).getPlanLimits(plan)

        const updatedPlatformPlan = await platformPlanService(log).update({ 
            platformId: platformPlan.platformId,
            ...planLimits,
        })

        return updatedPlatformPlan
    },

    async handleUpgrade(platformPlan: PlatformPlan, params: UpdateSubscriptionParams): Promise<PlatformPlan> {
        const { plan, extraUsers } = params

        if (plan !== PlanName.BUSINESS &&  !isNil(extraUsers) && extraUsers > 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Extra users are only available for business plan',
                },
            })
        }

        assertNotNullOrUndefined(platformPlan.stripeSubscriptionId, 'Stripe subscription id is not set')
        await stripeHelper(log).updateSubscription(
            platformPlan.stripeSubscriptionId,
            { plan, extraUsers },
        )

        log.info(`${plan} subscription updated for platform ${platformPlan.platformId}`)
        const planLimits = platformPlanService(log).getPlanLimits(plan)
        if (plan === PlanName.BUSINESS && !isNil(extraUsers) && Number(extraUsers) > 0) {
            planLimits.userSeatsLimit = (planLimits.userSeatsLimit ?? 0) + Number(extraUsers)
        }

        const updatedPlatformPlan = await platformPlanService(log).update({ 
            platformId: platformPlan.platformId,
            ...planLimits,
        })

        return updatedPlatformPlan


    },

    async update(params: UpdatePlatformBillingParams): Promise<PlatformPlan> {
        const { platformId, ...update } = params
        log.info({ platformId, update }, 'updating platform billing')

        const platformPlan = await platformPlanRepo().findOneByOrFail({
            platformId,
        })

        const normalizedUpdate = Object.fromEntries(
            Object.entries(update).map(([key, value]) => [key, value === undefined ? null : value]),
        )

        const updatedPlatformPlan = await platformPlanRepo().save({ ...platformPlan, ...normalizedUpdate })
        return updatedPlatformPlan
    },

    async updateSubscriptionIdByCustomerId(subscription: Partial<Stripe.Subscription>): Promise<PlatformPlan> {
        const stripeCustomerId = subscription.customer as string
        const platformPlan = await platformPlanRepo().findOneByOrFail({ stripeCustomerId })

        log.info({
            platformPlanId: platformPlan.id,
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
        }, 'Updating subscription id for platform plan')

        await platformPlanRepo().update(platformPlan.id, {
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status as ApSubscriptionStatus,
        })
        return platformPlanRepo().findOneByOrFail({ stripeCustomerId })
    },

    getPlanLimits,
})

async function createInitialBilling(platformId: string, log: FastifyBaseLogger): Promise<PlatformPlan> {
    const platform = await platformService.getOneOrThrow(platformId)
    const user = await userService.getMetaInformation({ id: platform.ownerId })
    const stripeCustomerId = await createInitialCustomer(user, platformId, log)
    const plan = getInitialPlanByEdition()

    const platformPlan: Omit<PlatformPlan, 'created' | 'updated'> = {
        id: apId(),
        platformId,
        stripeCustomerId: stripeCustomerId ?? undefined,
        ...plan,
    }

    return platformPlanRepo().save(platformPlan)
}

function getInitialPlanByEdition(): PlatformPlanLimits {
    switch (edition) {
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            return OPENSOURCE_PLAN
        case ApEdition.CLOUD:
            return FREE_CLOUD_PLAN
    }
}

async function createInitialCustomer(user: UserWithMetaInformation, platformId: string, log: FastifyBaseLogger): Promise<string | null> {
    const environment = system.getOrThrow(AppSystemProp.ENVIRONMENT)
    if (edition !== ApEdition.CLOUD || environment === ApEnvironment.TESTING) {
        return null
    }
    const stripeCustomerId = await stripeHelper(log).createCustomer(
        user,
        platformId,
    )
    return stripeCustomerId
}
