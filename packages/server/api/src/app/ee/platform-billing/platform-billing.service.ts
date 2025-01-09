import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT, PlatformBilling } from '@activepieces/ee-shared'
import { ActivepiecesError, apId, ErrorCode, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { repoFactory } from '../../core/db/repo-factory'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'
import { userService } from '../../user/user-service'
import { PlatformBillingEntity } from './platform-billing.entity'
import { stripeHelper } from './stripe-helper'

const platformBillingRepo = repoFactory(PlatformBillingEntity)

export const platformBillingService = (log: FastifyBaseLogger) => ({
    async getOrCreateForPlatform(platformId: string): Promise<PlatformBilling> {
        const platformBilling = await platformBillingRepo().findOneBy({ platformId })
        if (isNil(platformBilling)) {
            return createInitialBilling(platformId, log)
        }
        return platformBilling
    },

    async update(platformId: string, tasksLimit: number | undefined, aiCreditsLimit: number | undefined): Promise<PlatformBilling> {
        const platformBilling = await platformBillingRepo().findOneBy({ platformId })
        if (isNil(platformBilling)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: platformId,
                    entityType: 'PlatformBilling',
                    message: 'Platform billing not found by platform id',
                },
            })
        }
        platformBilling.tasksLimit = tasksLimit
        platformBilling.aiCreditsLimit = aiCreditsLimit
        return platformBillingRepo().save(platformBilling)
    },

    async updateSubscriptionIdByCustomerId(subscription: Stripe.Subscription): Promise<PlatformBilling> {
        const stripeCustomerId = subscription.customer as string
        const platformBilling = await platformBillingRepo().findOneByOrFail({ stripeCustomerId })
        log.info({
            platformBillingId: platformBilling.id,
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
        }, 'Updating subscription id for platform billing')
        await platformBillingRepo().update(platformBilling.id, {
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status as ApSubscriptionStatus,
        })
        return platformBillingRepo().findOneByOrFail({ stripeCustomerId })
    },
})


async function createInitialBilling(platformId: string, log: FastifyBaseLogger): Promise<PlatformBilling> {
    const platform = await platformService.getOneOrThrow(platformId)
    const user = await userService.getMetaInformation({ id: platform.ownerId })
    const stripeCustomerId = await stripeHelper(log).createCustomer(
        user,
        platformId,
    )
    // TODO(@amrabuaza) remove this once we have migrated all platform on the cloud
    const isEnterpriseCustomer = platformUtils.isEnterpriseCustomerOnCloud(platform)
    if (isEnterpriseCustomer) {
        return platformBillingRepo().save({
            id: apId(),
            platformId,
            tasksLimit: undefined,
            aiCreditsLimit: undefined,
            includedTasks: 50000,
            includedAiCredits: 0,
            stripeCustomerId,
        })
    }
    return platformBillingRepo().save({
        id: apId(),
        platformId,
        tasksLimit: DEFAULT_FREE_PLAN_LIMIT.tasks,
        aiCreditsLimit: DEFAULT_FREE_PLAN_LIMIT.aiTokens,
        includedTasks: DEFAULT_FREE_PLAN_LIMIT.tasks,
        includedAiCredits: DEFAULT_FREE_PLAN_LIMIT.aiTokens,
        stripeCustomerId,
    })
}
