import { ApSubscriptionStatus, BUSINESS_CLOUD_PLAN, FREE_CLOUD_PLAN, OPENSOURCE_PLAN, PlanName, PLUS_CLOUD_PLAN } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, apId, isNil, PlatformPlan, PlatformPlanLimits, spreadIfDefined, UserWithMetaInformation } from '@activepieces/shared'
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

        if (isNil(platformPlan) || isNil(platformPlan.stripeCustomerId)) {
            return createInitialBilling(platformId, log)
        }

        return platformPlan
    },

    async update(params: UpdatePlatformBillingParams): Promise<PlatformPlan> {
        const { platformId, ...update } = params
        log.info({ platformId, update }, 'updating platform billing')

        const platformPlan = await platformPlanRepo().findOneByOrFail({
            platformId,
        })

        const updatedPlatformPlan: PlatformPlan = {
            ...platformPlan,
            ...spreadIfDefined('plan', update.plan),
            ...spreadIfDefined('tasksLimit', update.tasksLimit),
            ...spreadIfDefined('includedTasks', update.includedTasks),
            ...spreadIfDefined('aiCreditsLimit', update.aiCreditsLimit),
            ...spreadIfDefined('includedAiCredits', update.includedAiCredits),
            ...spreadIfDefined('activeFlowsLimit', update.activeFlowsLimit),
            ...spreadIfDefined('projectsLimit', update.projectsLimit),
            ...spreadIfDefined('tablesLimit', update.tablesLimit),
            ...spreadIfDefined('mcpLimit', update.mcpLimit),
            ...spreadIfDefined('userSeatsLimit', update.userSeatsLimit),
            ...spreadIfDefined('environmentsEnabled', update.environmentsEnabled),
            ...spreadIfDefined('analyticsEnabled', update.analyticsEnabled),
            ...spreadIfDefined('showPoweredBy', update.showPoweredBy),
            ...spreadIfDefined('auditLogEnabled', update.auditLogEnabled),
            ...spreadIfDefined('embeddingEnabled', update.embeddingEnabled),
            ...spreadIfDefined('managePiecesEnabled', update.managePiecesEnabled),
            ...spreadIfDefined('manageTemplatesEnabled', update.manageTemplatesEnabled),
            ...spreadIfDefined('customAppearanceEnabled', update.customAppearanceEnabled),
            ...spreadIfDefined('manageProjectsEnabled', update.manageProjectsEnabled),
            ...spreadIfDefined('projectRolesEnabled', update.projectRolesEnabled),
            ...spreadIfDefined('customDomainsEnabled', update.customDomainsEnabled),
            ...spreadIfDefined('globalConnectionsEnabled', update.globalConnectionsEnabled),
            ...spreadIfDefined('customRolesEnabled', update.customRolesEnabled),
            ...spreadIfDefined('apiKeysEnabled', update.apiKeysEnabled),
            ...spreadIfDefined('alertsEnabled', update.alertsEnabled),
            ...spreadIfDefined('ssoEnabled', update.ssoEnabled),
            ...spreadIfDefined('tablesEnabled', update.tablesEnabled),
            ...spreadIfDefined('todosEnabled', update.todosEnabled),
        }

        await platformPlanRepo().save(updatedPlatformPlan)
        return updatedPlatformPlan
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
