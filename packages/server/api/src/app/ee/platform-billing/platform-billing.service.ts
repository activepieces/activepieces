import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT, PlatformBilling } from '@activepieces/ee-shared'
import { ActivepiecesError, apId, ErrorCode, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { repoFactory } from '../../core/db/repo-factory'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'
import { projectRepo } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { PlatformBillingEntity } from './platform-billing.entity'
import { stripeHelper } from './stripe-helper'

const platformBillingRepo = repoFactory(PlatformBillingEntity)

export const platformBillingService = (log: FastifyBaseLogger) => ({
    async getOrCreateForPlatform(platformId: string): Promise<PlatformBilling> {
        const platformBilling = await platformBillingRepo().findOneBy({ platformId })
        if (isNil(platformBilling)) {
            const newPlatformBilling = await createInitialBilling(platformId, log)
            await updateAllProjectsLimits(platformId, newPlatformBilling.tasksLimit, newPlatformBilling.aiCreditsLimit)
            return newPlatformBilling
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
        return platformBillingRepo().save({
            tasksLimit,
            aiCreditsLimit,
        })
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

async function updateAllProjectsLimits(platformId: string, tasksLimit: number | undefined, aiCreditsLimit: number | undefined) {
    const platform = await platformService.getOneOrThrow(platformId)
    if (!platform.manageProjectsEnabled) {
        return
    }
    const projects = await projectRepo().find({
        where: {
            platformId,
        },
    })
    for (const project of projects) {
        await projectLimitsService.upsert({
            tasks: tasksLimit,
            aiTokens: aiCreditsLimit,
        }, project.id)
    }
}