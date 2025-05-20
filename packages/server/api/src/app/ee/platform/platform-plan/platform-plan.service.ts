import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import { ActivepiecesError, apId, ErrorCode, isNil, PlatformPlan, PlatformPlanWithoutEntityData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'

import { repoFactory } from '../../../core/db/repo-factory'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { stripeHelper } from './stripe-helper'
import { PlatformPlanEntity } from './platform-plan.entity'

const platformPlanRepo = repoFactory(PlatformPlanEntity)

type UpdatePlatformBillingParams = {
    platformId: string
} & Partial<PlatformPlanWithoutEntityData>

export const platformBillingService = (log: FastifyBaseLogger) => ({
    async getOrCreateForPlatform(platformId: string): Promise<PlatformPlan> {
        const platformPlan = await platformPlanRepo().findOneBy({ platformId })
        if (isNil(platformPlan)) {
            return createInitialBilling(platformId, log)
        }
        return platformPlan
    },

    async update(params: UpdatePlatformBillingParams): Promise<PlatformPlan> {
        const platformPlan = await platformPlanRepo().findOneBy({ platformId: params.platformId })
        if (isNil(platformPlan)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: params.platformId,
                    entityType: 'PlatformBilling',
                    message: 'Platform billing not found by platform id',
                },
            })
        }

        return platformPlanRepo().save({
            tasksLimit: params.tasksLimit,
            id: platformPlan.id,
        })
    },

    async updateSubscriptionIdByCustomerId(subscription: Stripe.Subscription): Promise<PlatformPlan> {
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
})


async function createInitialBilling(platformId: string, log: FastifyBaseLogger): Promise<PlatformPlan> {
    const platform = await platformService.getOneOrThrow(platformId)
    const user = await userService.getMetaInformation({ id: platform.ownerId })
    const stripeCustomerId = await stripeHelper(log).createCustomer(
        user,
        platformId,
    )
    return platformPlanRepo().save({
        id: apId(),
        platformId,
        tasksLimit: DEFAULT_FREE_PLAN_LIMIT.tasks,
        aiCreditsLimit: DEFAULT_FREE_PLAN_LIMIT.aiTokens,
        includedTasks: DEFAULT_FREE_PLAN_LIMIT.tasks,
        includedAiCredits: DEFAULT_FREE_PLAN_LIMIT.aiTokens,
        stripeCustomerId,
    })
}
