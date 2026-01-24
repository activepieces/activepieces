import { isCloudPlanButNotEnterprise, OPEN_SOURCE_PLAN, PRICE_ID_MAP, PRICE_NAMES, STANDARD_CLOUD_PLAN } from '@activepieces/ee-shared'
import { apDayjs, AppSystemProp, getPlatformPlanNameKey } from '@activepieces/server-shared'
import { ActivepiecesError, AiCreditsAutoTopUpState, ApEdition, ApEnvironment, apId, ErrorCode, FlowStatus, isNil, PlatformPlan, PlatformPlanLimits, PlatformPlanWithOnlyLimits, PlatformUsage, PlatformUsageMetric, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { platformAiCreditsService } from './platform-ai-credits.service'
import { PlatformPlanEntity } from './platform-plan.entity'
import { stripeHelper } from './stripe-helper'

export const platformPlanRepo = repoFactory(PlatformPlanEntity)

type UpdatePlatformBillingParams = {
    platformId: string
} & Partial<PlatformPlanLimits>

const edition = system.getEdition()
const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)

export const ACTIVE_FLOW_PRICE_ID = getPriceIdFor(PRICE_NAMES.ACTIVE_FLOWS)

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

        if (isNil(startDate) || isNil(endDate)) {
            return { startDate: apDayjs().startOf('month').unix(), endDate: apDayjs().endOf('month').unix() }
        }
        return { startDate, endDate }
    },

    async update(params: UpdatePlatformBillingParams): Promise<PlatformPlan> {
        const { platformId, ...update } = params
        log.info({ platformId }, 'updating platform billing')

        const platformPlan = await platformPlanRepo().findOneByOrFail({
            platformId,
        })

        const normalizedUpdate = Object.fromEntries(
            Object.entries(update).map(([key, value]) => [key, value === undefined ? null : value]),
        )

        const updatedPlatformPlan = await platformPlanRepo().save({ ...platformPlan, ...normalizedUpdate })
        if (!isNil(updatedPlatformPlan.plan)) {
            await distributedStore.put(getPlatformPlanNameKey(platformId), updatedPlatformPlan.plan)
        }
        return updatedPlatformPlan
    },
    async getNextBillingAmount(params: GetBillingAmountParams): Promise<number> {
        const { subscriptionId } = params
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
            return 0
        }
    },
    async isCloudNonEnterprisePlan(platformId: string): Promise<boolean> {
        const platformPlan = await platformPlanRepo().findOneByOrFail({ platformId })
        return isCloudPlanButNotEnterprise(platformPlan.plan)
    },
    async getUsage(platformId: string): Promise<PlatformUsage> {
        const projectIds = await projectService.getProjectIdsByPlatform(platformId)
        const activeFlowsCount = await flowRepo().count({
            where: {
                projectId: In(projectIds),
                status: FlowStatus.ENABLED,
            },
        })
        const aiCreditsUsage = await platformAiCreditsService(log).getUsage(platformId)
        return {
            activeFlows: activeFlowsCount,
            aiCreditsLimit: aiCreditsUsage.limit,
            aiCreditsRemaining: aiCreditsUsage.usageRemaining,
            totalAiCreditsUsed: aiCreditsUsage.usage,
            totalAiCreditsUsedThisMonth: aiCreditsUsage.usageMonthly,
        }
    },
    checkActiveFlowsExceededLimit: async (platformId: string, metric: PlatformUsageMetric): Promise<void> => {
        if (ApEdition.COMMUNITY === edition) {
            return
        }
        const platformPlan = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)
        const usage = await platformPlanService(log).getUsage(platformId)
        if (!isNil(platformPlan.activeFlowsLimit) && usage.activeFlows >= platformPlan.activeFlowsLimit) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric,
                },
            })
        }
    },
})

function getPriceIdFor(price: PRICE_NAMES): string {
    const isDev = stripeSecretKey?.startsWith('sk_test')
    const env = isDev ? 'dev' : 'prod'

    const entry = PRICE_ID_MAP[price]

    if (!entry) {
        throw new Error(`No price with the given price name '${price}' is available`)
    }

    return entry[env]
}

function getInitialPlanByEdition(): PlatformPlanWithOnlyLimits {
    switch (edition) {
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            return OPEN_SOURCE_PLAN
        case ApEdition.CLOUD:
            return STANDARD_CLOUD_PLAN
    }
}

async function createInitialBilling(platformId: string, log: FastifyBaseLogger): Promise<PlatformPlan> {
    const platform = await platformService.getOneOrThrow(platformId)
    const user = await userService.getMetaInformation({ id: platform.ownerId })
    const stripeCustomerId = await createInitialCustomer(user, platformId, log)

    const defaultStartDate = apDayjs().startOf('month').unix()
    const defaultEndDate = apDayjs().endOf('month').unix()

    const plan = getInitialPlanByEdition()

    const platformPlan: Omit<PlatformPlan, 'created' | 'updated'> = {
        ...plan,
        id: apId(),
        platformId,
        stripeCustomerId,
        stripeSubscriptionStartDate: defaultStartDate,
        stripeSubscriptionEndDate: defaultEndDate,
        aiCreditsAutoTopUpState: plan.aiCreditsAutoTopUpState ?? AiCreditsAutoTopUpState.DISABLED,
    }
    const savedPlatformPlan = await platformPlanRepo().save(platformPlan)
    if (!isNil(savedPlatformPlan.plan)) {
        await distributedStore.put(getPlatformPlanNameKey(platformId), savedPlatformPlan.plan)
    }

    return savedPlatformPlan
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

type GetBillingAmountParams = {
    subscriptionId?: string
}