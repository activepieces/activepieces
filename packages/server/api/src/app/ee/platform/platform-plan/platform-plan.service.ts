import { ApSubscriptionStatus, BillingCycle, FREE_CLOUD_PLAN, OPEN_SOURCE_PLAN, PlanName } from '@activepieces/ee-shared'
import { apDayjs, AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, apId, isNil, PlatformPlan, PlatformPlanLimits, PlatformPlanWithOnlyLimits, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

import { repoFactory } from '../../../core/db/repo-factory'
import { distributedLock } from '../../../database/redis-connections'
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

export const platformPlanService = (log: FastifyBaseLogger) => ({
    async getOrCreateForPlatform(platformId: string): Promise<PlatformPlan> {
        const platformPlan = await platformPlanRepo().findOneBy({ platformId })
        if (!isNil(platformPlan)) return platformPlan

        return distributedLock(log).runExclusive({
            key: `platform_plan_${platformId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const platformPlan = await platformPlanRepo().findOneBy({ platformId })
                if (!isNil(platformPlan)) return platformPlan

                return createInitialBilling(platformId, log)
            },
        })
    },

    async getBillingDates(platformPlan: PlatformPlan): Promise<{ startDate: number, endDate: number }> {
        const { stripeSubscriptionStartDate: startDate, stripeSubscriptionEndDate: endDate } = platformPlan

        if ( isNil(startDate) || isNil(endDate)) {
            return { startDate: apDayjs().startOf('month').unix(), endDate: apDayjs().endOf('month').unix() }
        }
        return { startDate, endDate }
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

    async updateByCustomerId({ subscriptionId, status, customerId, startDate, endDate, cancelDate, stripePaymentMethod }: UpdateByCustomerId): Promise<PlatformPlan> {
        const platformPlan = await platformPlanRepo().findOneByOrFail({ stripeCustomerId: customerId })

        log.info({
            platformPlanId: platformPlan.id,
            subscriptionId,
            subscriptionStatus: status,
        }, 'Updating subscription id for platform plan')

        await platformPlanRepo().update(platformPlan.id, {
            stripeSubscriptionId: subscriptionId,
            stripeSubscriptionStatus: status as ApSubscriptionStatus,
            stripeSubscriptionStartDate: startDate,
            stripeSubscriptionEndDate: endDate,
            stripeSubscriptionCancelDate: cancelDate,
            stripePaymentMethod, 
        })
        return platformPlanRepo().findOneByOrFail({ stripeCustomerId: customerId })
    },
    async getNextBillingAmount(params: GetBillingAmountParams): Promise<number> {
        const { plan, subscriptionId } = params
        const stripe = stripeHelper(log).getStripe()
        if (isNil(stripe)) {
            return 0
        }

        try {
            const upcomingInvoice = await stripe.invoices.createPreview({
                subscription: subscriptionId,
            })

            return upcomingInvoice.amount_due ? upcomingInvoice.amount_due / 100 : 0
        }
        catch {
            switch (plan) {
                case PlanName.PLUS: {
                    return 25
                }
                case PlanName.BUSINESS: {
                    return 150
                }
                default: {
                    return 0
                }
            }
        }
    },
})

async function createInitialBilling(platformId: string, log: FastifyBaseLogger): Promise<PlatformPlan> {
    const platform = await platformService.getOneOrThrow(platformId)
    const user = await userService.getMetaInformation({ id: platform.ownerId })
    const stripeCustomerId = await createInitialCustomer(user, platformId, log)

    const plan = getInitialPlanByEdition()

    const defaultStartDate = apDayjs().startOf('month').unix()
    const defaultEndDate = apDayjs().endOf('month').unix()

    const platformPlan: Omit<PlatformPlan, 'created' | 'updated'> = {
        id: apId(),
        platformId,
        stripeCustomerId,
        stripeSubscriptionStartDate: defaultStartDate,
        stripeSubscriptionEndDate: defaultEndDate,
        stripeBillingCycle: BillingCycle.MONTHLY,
        ...plan,
    }
    return platformPlanRepo().save(platformPlan)
}

function getInitialPlanByEdition(): PlatformPlanWithOnlyLimits {
    switch (edition) {
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            return OPEN_SOURCE_PLAN
        case ApEdition.CLOUD:
            return FREE_CLOUD_PLAN
    }
}

async function createInitialCustomer(user: UserWithMetaInformation, platformId: string, log: FastifyBaseLogger): Promise<string | undefined> {
    const environment = system.getOrThrow(AppSystemProp.ENVIRONMENT)
    if (edition !== ApEdition.CLOUD || environment === ApEnvironment.TESTING) {
        return undefined
    }
    const stripeCustomerId = await stripeHelper(log).createCustomer(
        user,
        platformId,
    )
    return stripeCustomerId
}

type UpdateByCustomerId = {
    customerId: string
    subscriptionId: string
    status: ApSubscriptionStatus
    startDate: number
    endDate: number
    cancelDate?: number
    stripePaymentMethod?: string
}

type GetBillingAmountParams = {
    subscriptionId?: string
    plan: string
}