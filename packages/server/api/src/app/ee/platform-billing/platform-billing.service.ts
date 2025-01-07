import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT, PlatformBilling } from '@activepieces/ee-shared'
import { apId, isNil, spreadIfDefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { PlatformBillingEntity } from './platform-billing.entity'
import { stripeHelper } from './stripe-helper'
import Stripe from 'stripe'

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
            throw new Error('Platform billing not found')
        }
        platformBilling.tasksLimit = tasksLimit
        platformBilling.aiCreditsLimit = aiCreditsLimit
        return platformBillingRepo().save(platformBilling)
    },

    async updateSubscriptionIdByCustomerId(subscription: Stripe.Subscription): Promise<PlatformBilling> {
        const stripeCustomerId = subscription.customer as string
        const platformBilling = await platformBillingRepo().findOneByOrFail({ stripeCustomerId })
        log.info(`Updating subscription id for platform billing ${platformBilling.id}`)
        await platformBillingRepo().update(platformBilling.id, {
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status as ApSubscriptionStatus,
        })
        return platformBillingRepo().findOneByOrFail({ stripeCustomerId })
    }
})


async function createInitialBilling(platformId: string, log: FastifyBaseLogger): Promise<PlatformBilling> {
    const platform = await platformService.getOneOrThrow(platformId)
    const user = await userService.getOneOrFail({ id: platform.ownerId })
    const stripeCustomerId = await stripeHelper(log).createCustomer(
        user,
        platformId,
    )
    return platformBillingRepo().save({
        id: apId(),
        platformId,
        includedAiCredits: DEFAULT_FREE_PLAN_LIMIT.aiTokens,
        includedTasks: DEFAULT_FREE_PLAN_LIMIT.tasks,
        stripeCustomerId,
    })
}
