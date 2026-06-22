import { ActivepiecesError, apId, chunk, ErrorCode, isNil, PlatformUsageMetric } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AiCreditsAutoTopUpState, ApEdition, ApEnvironment, FlowStatus, isCloudPlanButNotEnterprise, OPEN_SOURCE_PLAN, PlatformPlan, PlatformPlanLimits, PlatformPlanWithOnlyLimits, PlatformUsage, PRICE_ID_MAP, PRICE_NAMES, STANDARD_CLOUD_PLAN, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { getEnrollAttemptKey, getPlatformPlanNameKey } from '../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { exceptionHandler } from '../../../helper/exception-handler'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { billingProvider } from '../../../platform/billing-provider'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { platformAiCreditsService } from './platform-ai-credits.service'
import { PlatformPlanEntity } from './platform-plan.entity'
import { stripeHelper } from './stripe-helper'

export const platformPlanRepo = repoFactory(PlatformPlanEntity)

type UpdatePlatformBillingParams = {
    platformId: string
} & Partial<PlatformPlanLimits>

const edition = system.getEdition()
const environment = system.get(AppSystemProp.ENVIRONMENT)
const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)
const ENROLL_ATTEMPT_TTL_SECONDS = 300
const AUTUMN_REFRESH_BATCH_SIZE = 200
const AUTUMN_REFRESH_CONCURRENCY = 10
// Assumed AppSumo lifetime-deal Autumn plan ids — NOT yet verified against the Autumn dashboard. Lifetime
// deals never expire, so they're skipped by the nightly refresh (same as free); update once confirmed.
const AUTUMN_APPSUMO_PLAN_IDS = [
    'appsumo_activepieces_tier1',
    'appsumo_activepieces_tier2',
    'appsumo_activepieces_tier3',
    'appsumo_activepieces_tier4',
    'appsumo_activepieces_tier5',
    'appsumo_activepieces_tier6',
]

export const ACTIVE_FLOW_PRICE_ID = getPriceIdFor(PRICE_NAMES.ACTIVE_FLOWS)

export const platformPlanService = (log: FastifyBaseLogger) => ({

    async getOrCreateForPlatform(platformId: string): Promise<PlatformPlan> {
        const existingPlatformPlan = await platformPlanRepo().findOneBy({ platformId })
        if (!isNil(existingPlatformPlan)) {
            triggerLazyAutumnEnrollment({ platformId, autumnCustomerId: existingPlatformPlan.autumnCustomerId }, log)
            return existingPlatformPlan
        }

        const platformPlan = await distributedLock(log).runExclusive({
            key: `platform_plan_${platformId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const platformPlan = await platformPlanRepo().findOneBy({ platformId })
                if (!isNil(platformPlan)) return platformPlan
                return createInitialBilling(platformId, log)
            },
        })
        triggerLazyAutumnEnrollment({ platformId, autumnCustomerId: null }, log)
        return platformPlan
    },

    onPlatformCreated(platformId: string): void {
        triggerLazyAutumnEnrollment({ platformId, autumnCustomerId: null }, log)
    },

    async refreshEnrolledPlatforms(): Promise<void> {
        let cursor: string | undefined = undefined
        let batchSize: number
        do {
            const builder = platformPlanRepo().createQueryBuilder('platformPlan')
                .where('platformPlan.autumnCustomerId IS NOT NULL')
                .andWhere('platformPlan.plan IS NOT NULL')
                .andWhere('platformPlan.plan NOT IN (:...appsumoPlanIds)', { appsumoPlanIds: AUTUMN_APPSUMO_PLAN_IDS })
                .orderBy('platformPlan.id', 'ASC')
                .take(AUTUMN_REFRESH_BATCH_SIZE)
            if (!isNil(cursor)) {
                builder.andWhere('platformPlan.id > :cursor', { cursor })
            }
            const batch = await builder.getMany()
            batchSize = batch.length
            for (const group of chunk(batch, AUTUMN_REFRESH_CONCURRENCY)) {
                await Promise.all(group.map((platformPlan) => refreshEnrolledPlatform(platformPlan.platformId, log)))
            }
            if (batch.length > 0) {
                cursor = batch[batch.length - 1].id
            }
        } while (batchSize === AUTUMN_REFRESH_BATCH_SIZE)
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
        log.info({ platform: { id: platformId } }, 'updating platform billing')

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
                subscription: subscriptionId ?? undefined,
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
        const activeFlowsCount = await flowRepo()
            .createQueryBuilder('flow')
            .innerJoin('project', 'project', 'project.id = flow."projectId"')
            .where('project."platformId" = :platformId', { platformId })
            .andWhere('flow.status = :status', { status: FlowStatus.ENABLED })
            .getCount()
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
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
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
    async getAutumnCredentials(platformId: string): Promise<AutumnCredentials> {
        const platformPlan = await platformPlanRepo().findOneByOrFail({ platformId })
        return {
            autumnCustomerId: platformPlan.autumnCustomerId,
            autumnApiKey: platformPlan.autumnApiKey,
        }
    },
    async setAutumnCredentials(params: SetAutumnCredentialsParams): Promise<void> {
        const { platformId, autumnCustomerId, autumnApiKey } = params
        const platformPlan = await platformPlanRepo().findOneByOrFail({ platformId })
        await platformPlanRepo().save({ ...platformPlan, autumnCustomerId, autumnApiKey })
    },
})

function triggerLazyAutumnEnrollment({ platformId, autumnCustomerId }: TriggerLazyAutumnEnrollmentParams, log: FastifyBaseLogger): void {
    if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING || !isNil(autumnCustomerId)) {
        return
    }
    rejectedPromiseHandler(throttledAutumnEnrollment(platformId, log), log)
}

async function throttledAutumnEnrollment(platformId: string, log: FastifyBaseLogger): Promise<void> {
    const reserved = await distributedStore.putIfAbsent(getEnrollAttemptKey(platformId), '1', ENROLL_ATTEMPT_TTL_SECONDS)
    if (!reserved) {
        return
    }
    await billingProvider.get(log).ensureEnrolled(platformId)
}

async function refreshEnrolledPlatform(platformId: string, log: FastifyBaseLogger): Promise<void> {
    try {
        await billingProvider.get(log).refreshEntitlements(platformId)
    }
    catch (error) {
        exceptionHandler.handle(error, log)
    }
}

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
    const platform = await platformService(log).getOneOrThrow(platformId)
    const user = await userService(log).getMetaInformation({ id: platform.ownerId })
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
    subscriptionId?: string | null
}

type AutumnCredentials = {
    autumnCustomerId: string | null
    autumnApiKey: string | null
}

type TriggerLazyAutumnEnrollmentParams = {
    platformId: string
    autumnCustomerId: string | null | undefined
}

type SetAutumnCredentialsParams = {
    platformId: string
    autumnCustomerId: string | null
    autumnApiKey: string | null
}