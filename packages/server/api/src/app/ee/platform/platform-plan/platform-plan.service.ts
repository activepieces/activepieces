import { ApSubscriptionStatus, BUSINESS_CLOUD_PLAN, FREE_CLOUD_PLAN, OPENSOURCE_PLAN, PlanName, PLUS_CLOUD_PLAN } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, apId, isNil, PlatformPlan, PlatformPlanLimits, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'

import { repoFactory } from '../../../core/db/repo-factory'
import { distributedLock } from '../../../helper/lock'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { PlatformPlanEntity } from './platform-plan.entity'
import { stripeHelper } from './stripe-helper'

export const platformPlanRepo = repoFactory(PlatformPlanEntity)

type UpdatePlatformBillingParams = {
    platformId: string
} & Partial<PlatformPlanLimits>

const edition = system.getEdition()

function getPlanLimits(planName: PlanName): Partial<PlatformPlanLimits> {
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
        if (!isNil(platformPlan)) return platformPlan

        const lock = await distributedLock.acquireLock({
            key: `platform_plan_${platformId}`,
            timeout: 5000,
            log,
        })

        try {

            const platformPlan = await platformPlanRepo().findOneBy({ platformId })
            if (!isNil(platformPlan)) return platformPlan

            return await createInitialBilling(platformId, log)
        }
        finally {
            await lock.release()
        }
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

    async updateSubscriptionStatus(subscription: Partial<Stripe.Subscription>): Promise<PlatformPlan> {
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
