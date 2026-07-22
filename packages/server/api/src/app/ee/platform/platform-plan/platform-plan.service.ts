import { ActivepiecesError, apId, Cursor, ErrorCode, isNil, PlatformUsageMetric, SeekPage, tryCatch } from '@activepieces/core-utils'
import { ApEdition, ApEnvironment, AUTUMN_FREE_PLAN, FlowStatus, InvitationStatus, isCloudPlanButNotEnterprise, OPEN_SOURCE_PLAN, PlatformPlan, PlatformPlanLimits, PlatformPlanWithOnlyLimits, PlatformUsage, PrincipalType, ProjectCreditUsage, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
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
import { getInvitationExpiryCutoff, userInvitationRepo } from '../../../user-invitations/user-invitation.service'
import { platformProjectService } from '../../projects/platform-project-service'
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
            triggerLazyBillingProviderSync({ platformId, autumnCustomerId: existingPlatformPlan.autumnCustomerId }, log)
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
        triggerLazyBillingProviderSync({ platformId, autumnCustomerId: null }, log)
        return platformPlan
    },

    async onPlatformCreated(platformId: string): Promise<void> {
        await createInitialBilling(platformId)
        await enrollBillingProviderOnCreate(platformId, log)
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
        const { activeUsers, invitedSeats, usedSeats } = await countUsedSeats({ platformId, log })
        return {
            activeFlows: activeFlowsCount,
            teamProjects: teamProjectsCount,
            users: usedSeats,
            activeUsers,
            invitedSeats,
            creditsUsed: credits?.usage ?? 0,
            creditsRemaining: isNil(credits) ? 0 : credits.remaining,
            creditsNextResetAt: credits?.nextResetAt ?? null,
            appSumoAiCreditsUsed: isNil(appSumo) ? null : appSumo.usage,
            appSumoAiCreditsRemaining: isNil(appSumo) ? null : Math.max(0, appSumo.limit - appSumo.usage),
        }
    },
    async getCreditUsageByProject({ platformId, startDate, endDate, cursor, limit, userId, principalType }: GetCreditUsageByProjectParams): Promise<SeekPage<ProjectCreditUsage>> {
        const user = await userService(log).getOneOrFail({ id: userId })
        const projectsPage = await platformProjectService(log).getForPlatform({
            platformId,
            userId,
            cursorRequest: cursor,
            limit,
            isPrivileged: userService(log).isUserPrivileged(user),
            principalType,
        })

        const { byProject } = await billingProvider.get(log).getCreditUsage({ platformId, startDate, endDate })
        const creditsByProjectId = new Map(byProject.map((entry) => [entry.projectId, entry.creditsUsed]))

        return {
            data: projectsPage.data.map((project): ProjectCreditUsage => ({
                projectId: project.id,
                projectName: project.displayName,
                creditsUsed: creditsByProjectId.get(project.id) ?? 0,
            })),
            next: projectsPage.next,
            previous: projectsPage.previous,
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
    checkUsersExceededLimit: async ({ platformId, entityManager, additionalSeatsNeeded = 1 }: CheckUsersExceededLimitParams): Promise<void> => {
        if (ApEdition.COMMUNITY === edition) {
            return
        }
        if (!await billingProvider.get(log).isBillingEnforced(platformId)) {
            return
        }
        await platformPlanService(log).getOrCreateForPlatform(platformId)
        const platformPlan = await platformPlanRepo(entityManager)
            .createQueryBuilder('platform_plan')
            .setLock('pessimistic_write')
            .where('platform_plan.platformId = :platformId', { platformId })
            .getOne()
        if (isNil(platformPlan)) {
            return
        }
        const usersLimit = effectiveUsersLimit(platformPlan)
        if (isNil(usersLimit)) {
            return
        }
        const { usedSeats } = await countUsedSeats({ platformId, log, entityManager })
        if (usedSeats + additionalSeatsNeeded > usersLimit) {
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

export async function assertSeatsNotBelowActiveUsers({ platformId, targetLimit, log }: AssertSeatsNotBelowActiveUsersParams): Promise<void> {
    const { usedSeats } = await countUsedSeats({ platformId, log })
    if (targetLimit < usedSeats) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: {
                metric: PlatformUsageMetric.USERS,
            },
        })
    }
}


function effectiveUsersLimit({ usersLimit, scheduledUsersLimit }: Pick<PlatformPlan, 'usersLimit' | 'scheduledUsersLimit'>): number | null {
    const limits = [usersLimit, scheduledUsersLimit].filter((limit): limit is number => !isNil(limit))
    return limits.length === 0 ? null : Math.min(...limits)
}

export async function countUsedSeats({ platformId, log, entityManager }: CountUsedSeatsParams): Promise<SeatBreakdown> {
    const [activeUsers, invitedSeats] = await Promise.all([
        userService(log).countActiveByPlatformId(platformId),
        countReservedInvites({ platformId, entityManager }),
    ])
    return { activeUsers, invitedSeats, usedSeats: activeUsers + invitedSeats }
}

async function countReservedInvites({ platformId, entityManager }: { platformId: string, entityManager?: EntityManager }): Promise<number> {
    const result = await userInvitationRepo(entityManager)
        .createQueryBuilder('invitation')
        .select('COUNT(DISTINCT LOWER(invitation.email))', 'count')
        .where('invitation.platformId = :platformId', { platformId })
        .andWhere('invitation.status IN (:...statuses)', { statuses: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] })
        .andWhere('invitation.created > :expiryCutoff', { expiryCutoff: getInvitationExpiryCutoff() })
        .andWhere(`NOT EXISTS (
            SELECT 1
            FROM user_identity identity
            INNER JOIN "user" existing_user
                ON existing_user."identityId" = identity.id
                AND existing_user."platformId" = invitation."platformId"
            WHERE LOWER(identity.email) = LOWER(invitation.email)
        )`)
        .getRawOne<{ count: string }>()
    return Number(result?.count ?? 0)
}

function triggerLazyBillingProviderSync({ platformId, autumnCustomerId }: TriggerLazyBillingProviderSyncParams, log: FastifyBaseLogger): void {
    if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
        return
    }
    if (isNil(autumnCustomerId)) {
        rejectedPromiseHandler(throttledBillingProviderEnrollment(platformId, log), log)
        return
    }
    rejectedPromiseHandler(throttledBillingProviderRefresh(platformId, log), log)
}

async function enrollBillingProviderOnCreate(platformId: string, log: FastifyBaseLogger): Promise<void> {
    if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
        return
    }
    await throttledBillingProviderEnrollment(platformId, log)
        .catch((error) => log.warn({ error, platform: { id: platformId } }, 'Billing provider enrollment failed on platform creation'))
}

async function throttledBillingProviderEnrollment(platformId: string, log: FastifyBaseLogger): Promise<void> {
    await distributedStore.runOnceWithin(getEnrollAttemptKey(platformId), ENROLL_ATTEMPT_TTL_SECONDS, () =>
        billingProvider.get(log).ensureEnrolled(platformId),
    )
}

async function throttledBillingProviderRefresh(platformId: string, log: FastifyBaseLogger): Promise<void> {
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

type TriggerLazyBillingProviderSyncParams = {
    platformId: string
    autumnCustomerId: string | null | undefined
}

type SetAutumnCredentialsParams = {
    platformId: string
    autumnCustomerId: string | null
    autumnApiKey: string | null
}

type GetCreditUsageByProjectParams = {
    platformId: string
    startDate?: string
    endDate?: string
    cursor: Cursor | null
    limit: number
    userId: string
    principalType: PrincipalType
}

type AssertSeatsNotBelowActiveUsersParams = {
    platformId: string
    targetLimit: number
    log: FastifyBaseLogger
}

export type CheckUsersExceededLimitParams = {
    platformId: string
    entityManager: EntityManager
    additionalSeatsNeeded?: number
}

export type CountUsedSeatsParams = {
    platformId: string
    log: FastifyBaseLogger
    entityManager?: EntityManager
}

export type SeatBreakdown = {
    activeUsers: number
    invitedSeats: number
    usedSeats: number
}