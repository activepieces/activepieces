import { ActivepiecesError, apId, ErrorCode, isNil, PlatformUsageMetric } from '@activepieces/core-utils'
import { AiCreditsAutoTopUpState, ApEdition, ApEnvironment, FlowStatus, isCloudPlanButNotEnterprise, OPEN_SOURCE_PLAN, PlatformPlan, PlatformPlanLimits, PlatformPlanWithOnlyLimits, PlatformUsage, STANDARD_CLOUD_PLAN } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { getBillingEnforcedKey, getEnrollAttemptKey, getEntitlementsRefreshKey, getPlatformPlanNameKey } from '../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { billingProvider } from '../../../platform/billing-provider'
import { userService } from '../../../user/user-service'
import { platformAiCreditsService } from './platform-ai-credits.service'
import { PlatformPlanEntity } from './platform-plan.entity'

export const platformPlanRepo = repoFactory(PlatformPlanEntity)

type UpdatePlatformBillingParams = {
    platformId: string
} & Partial<PlatformPlanLimits>

const edition = system.getEdition()
const environment = system.get(AppSystemProp.ENVIRONMENT)
const ENROLL_ATTEMPT_TTL_SECONDS = 300
const ENTITLEMENTS_REFRESH_TTL_SECONDS = 15 * 60
const REFRESH_CLAIM_TTL_SECONDS = 60

export const platformPlanService = (log: FastifyBaseLogger) => ({

    async getOrCreateForPlatform(platformId: string): Promise<PlatformPlan> {
        const existingPlatformPlan = await platformPlanRepo().findOneBy({ platformId })
        if (!isNil(existingPlatformPlan)) {
            triggerLazyAutumnSync({ platformId, autumnCustomerId: existingPlatformPlan.autumnCustomerId }, log)
            return existingPlatformPlan
        }

        const platformPlan = await distributedLock(log).runExclusive({
            key: `platform_plan_${platformId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const platformPlan = await platformPlanRepo().findOneBy({ platformId })
                if (!isNil(platformPlan)) return platformPlan
                return createInitialBilling(platformId)
            },
        })
        triggerLazyAutumnSync({ platformId, autumnCustomerId: null }, log)
        return platformPlan
    },

    onPlatformCreated(platformId: string): void {
        triggerLazyAutumnSync({ platformId, autumnCustomerId: null }, log)
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
        else {
            await distributedStore.delete(getPlatformPlanNameKey(platformId))
        }
        await distributedStore.put(getBillingEnforcedKey(platformId), updatedPlatformPlan.billingEnforced === true)
        return updatedPlatformPlan
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
        const appSumoAiCredits = await billingProvider.get(log).getAppSumoAiCreditsUsage(platformId)
        return {
            activeFlows: activeFlowsCount,
            aiCreditsLimit: aiCreditsUsage.limit,
            aiCreditsRemaining: aiCreditsUsage.usageRemaining,
            totalAiCreditsUsed: aiCreditsUsage.usage,
            totalAiCreditsUsedThisMonth: aiCreditsUsage.usageMonthly,
            appSumoAiCredits,
        }
    },
    checkActiveFlowsExceededLimit: async (platformId: string): Promise<void> => {
        if (ApEdition.COMMUNITY === edition) {
            return
        }
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const usage = await platformPlanService(log).getUsage(platformId)
        if (!isNil(platformPlan.activeFlowsLimit) && usage.activeFlows >= platformPlan.activeFlowsLimit) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: PlatformUsageMetric.ACTIVE_FLOWS,
                },
            })
        }
    },
    checkUsersExceededLimit: async (platformId: string): Promise<void> => {
        if (ApEdition.COMMUNITY === edition) {
            return
        }
        if (!await billingProvider.get(log).shouldBlock(platformId)) {
            return
        }
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (isNil(platformPlan.usersLimit)) {
            return
        }
        const usersCount = await userService(log).countByPlatformId(platformId)
        if (usersCount >= platformPlan.usersLimit) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: PlatformUsageMetric.USERS,
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

function triggerLazyAutumnSync({ platformId, autumnCustomerId }: TriggerLazyAutumnSyncParams, log: FastifyBaseLogger): void {
    if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
        return
    }
    if (isNil(autumnCustomerId)) {
        rejectedPromiseHandler(throttledAutumnEnrollment(platformId, log), log)
        return
    }
    rejectedPromiseHandler(throttledAutumnRefresh(platformId, log), log)
}

async function throttledAutumnEnrollment(platformId: string, log: FastifyBaseLogger): Promise<void> {
    const reserved = await distributedStore.putIfAbsent(getEnrollAttemptKey(platformId), '1', ENROLL_ATTEMPT_TTL_SECONDS)
    if (!reserved) {
        return
    }
    await billingProvider.get(log).ensureEnrolled(platformId)
}

// Claim the refresh window with a short marker first; only extend it to the full window AFTER a successful
// refresh, so a transient Autumn failure (the extend never runs) frees the claim in ~1 min for a retry,
// while a success suppresses re-refresh for the whole window. Fail-open: the projection keeps its last value.
async function throttledAutumnRefresh(platformId: string, log: FastifyBaseLogger): Promise<void> {
    const claimed = await distributedStore.putIfAbsent(getEntitlementsRefreshKey(platformId), '1', REFRESH_CLAIM_TTL_SECONDS)
    if (!claimed) {
        return
    }
    await billingProvider.get(log).refreshEntitlements(platformId)
    await distributedStore.put(getEntitlementsRefreshKey(platformId), '1', ENTITLEMENTS_REFRESH_TTL_SECONDS)
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

async function createInitialBilling(platformId: string): Promise<PlatformPlan> {
    const plan = getInitialPlanByEdition()

    const platformPlan: Omit<PlatformPlan, 'created' | 'updated'> = {
        ...plan,
        id: apId(),
        platformId,
        aiCreditsAutoTopUpState: plan.aiCreditsAutoTopUpState ?? AiCreditsAutoTopUpState.DISABLED,
    }
    const savedPlatformPlan = await platformPlanRepo().save(platformPlan)
    if (!isNil(savedPlatformPlan.plan)) {
        await distributedStore.put(getPlatformPlanNameKey(platformId), savedPlatformPlan.plan)
    }

    return savedPlatformPlan
}

type AutumnCredentials = {
    autumnCustomerId: string | null
    autumnApiKey: string | null
}

type TriggerLazyAutumnSyncParams = {
    platformId: string
    autumnCustomerId: string | null | undefined
}

type SetAutumnCredentialsParams = {
    platformId: string
    autumnCustomerId: string | null
    autumnApiKey: string | null
}