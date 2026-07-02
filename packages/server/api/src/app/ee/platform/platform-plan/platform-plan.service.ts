import { ActivepiecesError, apId, ErrorCode, isNil, PlatformUsageMetric, tryCatch } from '@activepieces/core-utils'
import { ApEdition, ApEnvironment, AUTUMN_FREE_PLAN, FlowStatus, isCloudPlanButNotEnterprise, OPEN_SOURCE_PLAN, PlatformPlan, PlatformPlanLimits, PlatformPlanWithOnlyLimits, PlatformUsage, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { getEnrollAttemptKey, getEntitlementsRefreshKey, getPlatformPlanNameKey } from '../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { billingProvider } from '../../../platform/billing-provider'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
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
const PLATFORM_PLAN_NAME_TTL_SECONDS = 24 * 60 * 60

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
            await distributedStore.put(getPlatformPlanNameKey(platformId), updatedPlatformPlan.plan, PLATFORM_PLAN_NAME_TTL_SECONDS)
        }
        else {
            await distributedStore.delete(getPlatformPlanNameKey(platformId))
        }
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
        const { data: consumables, error: consumablesError } = await tryCatch(() => billingProvider.get(log).getConsumablesUsage(platformId))
        if (!isNil(consumablesError)) {
            log.error({ error: consumablesError, platform: { id: platformId } }, 'Failed to fetch consumables usage; treating as unavailable')
        }
        const credits = consumables?.credits ?? null
        const appSumo = consumables?.appSumo ?? null
        const teamProjectsCount = await projectService(log).countByPlatformIdAndType(platformId, ProjectType.TEAM)
        const usersCount = await userService(log).countByPlatformId(platformId)
        return {
            activeFlows: activeFlowsCount,
            teamProjects: teamProjectsCount,
            users: usersCount,
            creditsUsed: credits?.usage ?? 0,
            creditsRemaining: isNil(credits) ? 0 : credits.remaining,
            creditsNextResetAt: credits?.nextResetAt ?? null,
            appSumoAiCredits: isNil(appSumo) ? null : appSumo.usage,
            appSumoAiCreditsRemaining: isNil(appSumo) ? null : Math.max(0, appSumo.limit - appSumo.usage),
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
        if (!await billingProvider.get(log).isBillingEnforced(platformId)) {
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
    await distributedStore.runOnceWithin(getEnrollAttemptKey(platformId), ENROLL_ATTEMPT_TTL_SECONDS, () =>
        billingProvider.get(log).ensureEnrolled(platformId),
    )
}

async function throttledAutumnRefresh(platformId: string, log: FastifyBaseLogger): Promise<void> {
    await distributedStore.runOnceWithin(getEntitlementsRefreshKey(platformId), REFRESH_CLAIM_TTL_SECONDS, async () => {
        await billingProvider.get(log).refreshEntitlements(platformId)
        await distributedStore.put(getEntitlementsRefreshKey(platformId), '1', ENTITLEMENTS_REFRESH_TTL_SECONDS)
    })
}

function getInitialPlanByEdition(): PlatformPlanWithOnlyLimits {
    switch (edition) {
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            return OPEN_SOURCE_PLAN
        case ApEdition.CLOUD:
            return AUTUMN_FREE_PLAN
    }
}

async function createInitialBilling(platformId: string): Promise<PlatformPlan> {
    const plan = getInitialPlanByEdition()

    const platformPlan: Omit<PlatformPlan, 'created' | 'updated'> = {
        ...plan,
        id: apId(),
        platformId,
    }
    const savedPlatformPlan = await platformPlanRepo().save(platformPlan)
    if (!isNil(savedPlatformPlan.plan)) {
        await distributedStore.put(getPlatformPlanNameKey(platformId), savedPlatformPlan.plan, PLATFORM_PLAN_NAME_TTL_SECONDS)
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