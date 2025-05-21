import { ApSubscriptionStatus, FREE_CLOUD_PLAN, OPENSOURCE_PLAN } from '@activepieces/ee-shared'
import { ApEdition, apId, isNil, PlatformPlan, PlatformPlanLimits, spreadIfDefined, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'

import { repoFactory } from '../../../core/db/repo-factory'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { PlatformPlanEntity } from './platform-plan.entity'
import { stripeHelper } from './stripe-helper'

const platformPlanRepo = repoFactory(PlatformPlanEntity)

type UpdatePlatformBillingParams = {
    platformId: string
} & Partial<PlatformPlanLimits>
const edition = system.getEdition()

export const platformPlanService = (log: FastifyBaseLogger) => ({
    async getOrCreateForPlatform(platformId: string): Promise<PlatformPlan> {
        const platformPlan = await platformPlanRepo().findOneBy({ platformId })
        if (isNil(platformPlan)) {
            return createInitialBilling(platformId, log)
        }
        return platformPlan
    },


    async update(params: UpdatePlatformBillingParams): Promise<PlatformPlan> {
        const platformPlan = await this.getOrCreateForPlatform(params.platformId)
        await platformPlanRepo().update(platformPlan.id, {
            ...spreadIfDefined('tasksLimit', params.tasksLimit),
            ...spreadIfDefined('aiCreditsLimit', params.aiCreditsLimit),
            ...spreadIfDefined('includedTasks', params.includedTasks),
            ...spreadIfDefined('includedAiCredits', params.includedAiCredits),
            ...spreadIfDefined('environmentsEnabled', params.environmentsEnabled),
            ...spreadIfDefined('analyticsEnabled', params.analyticsEnabled),
            ...spreadIfDefined('showPoweredBy', params.showPoweredBy),
            ...spreadIfDefined('auditLogEnabled', params.auditLogEnabled),
            ...spreadIfDefined('embeddingEnabled', params.embeddingEnabled),
            ...spreadIfDefined('managePiecesEnabled', params.managePiecesEnabled),
            ...spreadIfDefined('manageTemplatesEnabled', params.manageTemplatesEnabled),
            ...spreadIfDefined('customAppearanceEnabled', params.customAppearanceEnabled),
            ...spreadIfDefined('manageProjectsEnabled', params.manageProjectsEnabled),
            ...spreadIfDefined('projectRolesEnabled', params.projectRolesEnabled),
            ...spreadIfDefined('customDomainsEnabled', params.customDomainsEnabled),
            ...spreadIfDefined('globalConnectionsEnabled', params.globalConnectionsEnabled),
            ...spreadIfDefined('customRolesEnabled', params.customRolesEnabled),
            ...spreadIfDefined('apiKeysEnabled', params.apiKeysEnabled),
            ...spreadIfDefined('tablesEnabled', params.tablesEnabled),
            ...spreadIfDefined('todosEnabled', params.todosEnabled),
            ...spreadIfDefined('alertsEnabled', params.alertsEnabled),
            ...spreadIfDefined('ssoEnabled', params.ssoEnabled),
            ...spreadIfDefined('licenseKey', params.licenseKey),
            ...spreadIfDefined('stripeCustomerId', params.stripeCustomerId),
            ...spreadIfDefined('stripeSubscriptionId', params.stripeSubscriptionId),
            ...spreadIfDefined('stripeSubscriptionStatus', params.stripeSubscriptionStatus),
        })
        return platformPlanRepo().findOneByOrFail({ platformId: params.platformId })
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
    if (edition !== ApEdition.CLOUD) {
        return null
    }
    const stripeCustomerId = await stripeHelper(log).createCustomer(
        user,
        platformId,
    )
    return stripeCustomerId
}
