import { isNil, tryCatch } from '@activepieces/core-utils'
import { InvitationStatus, SELF_SERVE_TRIAL_PLANS, SelfServeTrialDates, SelfServeTrialState, UserStatus } from '@activepieces/shared'
import { JobsOptions } from 'bullmq'
import dayjs, { Dayjs } from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In, IsNull } from 'typeorm'
import { transaction } from '../../../core/db/transaction'
import { getBillingEnforcedKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { mcpGrantRevocation } from '../../../mcp/oauth/token/mcp-grant-revocation'
import { billingProvider } from '../../../platform/billing-provider'
import { userRepo, userService } from '../../../user/user-service'
import { EMAIL_IS_NOT_ALREADY_A_PLATFORM_USER, getInvitationExpiryCutoff, userInvitationsService } from '../../../user-invitations/user-invitation.service'
import { platformPlanTelemetry } from './platform-plan-telemetry'
import { countUsedSeats, platformPlanRepo } from './platform-plan.service'

const SEAT_GRACE_DAYS = 7
const SWEEP_HOUR_UTC = 15
const SWEEP_MINUTE_UTC = 30

export const trialSeatCleanup = (log: FastifyBaseLogger) => ({
    async endsAt({ platformId, selfServeTrialDates }: EndsAtParams): Promise<string | null> {
        if (!isInTrialGracePeriod(selfServeTrialDates)) {
            return null
        }
        const plan = await platformPlanRepo().findOneBy({ platformId })
        const seats = await seatsOverLimit({ platformId, usersLimit: plan?.usersLimit, billingEnforced: await billingEnforcedOrUnknown(platformId), log })
        return isNil(seats) ? null : trialGracePeriodEndsAt(selfServeTrialDates).toISOString()
    },
    async sweep(): Promise<void> {
        const failedPlatformIds = new Set<string>()
        for (const platformId of await findPlatformsWithUnlimitedSeats()) {
            const { error } = await tryCatch(() => billingProvider.get(log).refreshEntitlements(platformId))
            if (!isNil(error)) {
                log.error({ error, platform: { id: platformId } }, 'Failed to refresh a platform still holding trial seats')
                failedPlatformIds.add(platformId)
            }
        }
        for (const platformId of await findPlatformsOverTheirSeats()) {
            const { error } = await tryCatch(() => deactivateExtraUsersIfDeadlinePassed({ platformId, log }))
            if (!isNil(error)) {
                log.error({ error, platform: { id: platformId } }, 'Failed to end the seat grace')
                failedPlatformIds.add(platformId)
            }
        }
        if (failedPlatformIds.size > 0) {
            throw new Error(`Failed to end the seat grace for ${failedPlatformIds.size} platform(s); the sweep job retries them`)
        }
    },
})

async function deactivateExtraUsersIfDeadlinePassed({ platformId, log }: PlatformLogParams): Promise<void> {
    const selfServeTrial = await billingProvider.get(log).getSelfServeTrialInfo({ platformId, bypassCacheAndFetchFromProvider: true })
    if (selfServeTrial.state !== SelfServeTrialState.ENDED) {
        return
    }
    if (trialGracePeriodEndsAt(selfServeTrial).isAfter(dayjs())) {
        return
    }
    await deactivateTrialUsersAndInvitationsOverLimit({ platformId, selfServeTrialDates: selfServeTrial, log })
}

async function deactivateTrialUsersAndInvitationsOverLimit({ platformId, selfServeTrialDates, log }: DeactivateTrialUsersAndInvitationsOverLimitParams): Promise<void> {
    await billingProvider.get(log).refreshEntitlements(platformId)
    const billingEnforced = await billingProvider.get(log).isBillingEnforced(platformId)
    const removed = await transaction(async (entityManager) => {
        const plan = await platformPlanRepo(entityManager)
            .createQueryBuilder('platform_plan')
            .setLock('pessimistic_write')
            .where('platform_plan.platformId = :platformId', { platformId })
            .getOneOrFail()
        await userService(log).lockActiveByPlatformId({ platformId, entityManager })
        await userInvitationsService(log).lockPendingInvites({ platformId, entityManager })
        const seats = await seatsOverLimit({ platformId, usersLimit: plan.usersLimit, billingEnforced, log, entityManager })
        if (isNil(seats)) {
            return { deactivatedUserIds: [], revokedInvites: 0, revokedGrantIds: [] }
        }
        const revokedInvites = await userInvitationsService(log).revokeNewestInvitedBetween({ platformId, from: selfServeTrialDates.startedAt, to: selfServeTrialDates.endsAt, limit: seats.seatsOver, entityManager })
        const usersToDeactivate = seats.seatsOver - revokedInvites
        const deactivatedUserIds = await getNewestTrialUserIds({ platformId, selfServeTrialDates, limit: usersToDeactivate, log, entityManager })
        if (deactivatedUserIds.length > 0) {
            await userRepo(entityManager).update({ id: In(deactivatedUserIds), platformId }, { status: UserStatus.INACTIVE })
        }
        const revokedGrantIds = await mcpGrantRevocation.revokeUsersActiveGrantsInTransaction({ platformId, userIds: deactivatedUserIds, entityManager })
        return { deactivatedUserIds, revokedInvites, revokedGrantIds }
    })
    await mcpGrantRevocation.blockRevokedGrants({ grantIds: removed.revokedGrantIds, platformId, log })
    const deactivatedUsers = removed.deactivatedUserIds.length
    if (deactivatedUsers > 0 || removed.revokedInvites > 0) {
        rejectedPromiseHandler(platformPlanTelemetry(log).onTrialSeatsDeactivated({ platformId, deactivatedUsers, revokedInvites: removed.revokedInvites }), log)
    }
    log.info({ platform: { id: platformId }, seatGrace: { deactivatedCount: deactivatedUsers, revokedInviteCount: removed.revokedInvites } }, 'Seat grace ended')
}

async function findPlatformsWithUnlimitedSeats(): Promise<string[]> {
    const plans = await platformPlanRepo().find({
        select: { platformId: true },
        where: { usersLimit: IsNull(), plan: In([...SELF_SERVE_TRIAL_PLANS]) },
    })
    return plans.map((plan) => plan.platformId)
}

async function findPlatformsOverTheirSeats(): Promise<string[]> {
    const rows = await platformPlanRepo()
        .createQueryBuilder('platform_plan')
        .select('platform_plan.platformId', 'platformId')
        .innerJoin(`(${ACTIVE_USERS_PER_PLATFORM})`, 'active_users', 'active_users."platformId" = platform_plan."platformId"')
        .leftJoin(`(${PENDING_INVITES_PER_PLATFORM})`, 'pending_invites', 'pending_invites."platformId" = platform_plan."platformId"')
        .where('platform_plan.usersLimit IS NOT NULL')
        .andWhere('active_users.seats + COALESCE(pending_invites.seats, 0) > platform_plan."usersLimit"')
        .setParameters({
            active: UserStatus.ACTIVE,
            pendingStatuses: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED],
            expiryCutoff: getInvitationExpiryCutoff(),
        })
        .getRawMany<{ platformId: string }>()
    return rows.map((row) => row.platformId)
}

async function seatsOverLimit({ platformId, usersLimit, billingEnforced, log, entityManager }: SeatsOverLimitParams): Promise<SeatsOverLimit | null> {
    if (!billingEnforced || isNil(usersLimit)) {
        return null
    }
    const { activeUsers, invitedSeats, usedSeats } = await countUsedSeats({ platformId, log, entityManager })
    const seatsOver = usedSeats - usersLimit
    return seatsOver <= 0 ? null : { activeUsers, pendingInvitations: invitedSeats, usersLimit, seatsOver }
}

async function getNewestTrialUserIds({ platformId, selfServeTrialDates, limit, log, entityManager }: GetNewestTrialUserIdsParams): Promise<string[]> {
    if (limit <= 0) {
        return []
    }
    const users = await userService(log).activeUsersQuery({ platformId, entityManager })
        .select('user.id')
        .andWhere('user.created >= :addedSince', { addedSince: dayjs(selfServeTrialDates.startedAt).toISOString() })
        .andWhere('user.created <= :addedBefore', { addedBefore: dayjs(selfServeTrialDates.endsAt).toISOString() })
        .andWhere(USER_IS_NOT_THE_PLATFORM_OWNER)
        .orderBy('user.created', 'DESC')
        .limit(limit)
        .getMany()
    return users.map((user) => user.id)
}

function trialGracePeriodEndsAt(selfServeTrialDates: SelfServeTrialDates): Dayjs {
    const graceEnd = dayjs(selfServeTrialDates.endsAt).add(SEAT_GRACE_DAYS, 'day')
    const sweepOnGraceEndDay = graceEnd.utc().hour(SWEEP_HOUR_UTC).minute(SWEEP_MINUTE_UTC).second(0).millisecond(0)
    return sweepOnGraceEndDay.isBefore(graceEnd) ? sweepOnGraceEndDay.add(1, 'day') : sweepOnGraceEndDay
}

function isInTrialGracePeriod(selfServeTrialDates: SelfServeTrialDates): boolean {
    const now = dayjs()
    return !dayjs(selfServeTrialDates.endsAt).isAfter(now) && trialGracePeriodEndsAt(selfServeTrialDates).isAfter(now)
}

async function billingEnforcedOrUnknown(platformId: string): Promise<boolean> {
    return (await distributedStore.get<boolean>(getBillingEnforcedKey(platformId))) !== false
}

const ACTIVE_USERS_PER_PLATFORM = `SELECT "user"."platformId", COUNT(*) AS seats
    FROM "user"
    WHERE "user".status = :active
    GROUP BY "user"."platformId"`

const PENDING_INVITES_PER_PLATFORM = `SELECT invitation."platformId", COUNT(DISTINCT LOWER(invitation.email)) AS seats
    FROM user_invitation invitation
    WHERE invitation.status IN (:...pendingStatuses)
    AND invitation.updated > :expiryCutoff
    AND ${EMAIL_IS_NOT_ALREADY_A_PLATFORM_USER}
    GROUP BY invitation."platformId"`

const USER_IS_NOT_THE_PLATFORM_OWNER = `NOT EXISTS (
    SELECT 1
    FROM platform
    WHERE platform.id = "user"."platformId"
    AND platform."ownerId" = "user".id
)`

type EndsAtParams = {
    platformId: string
    selfServeTrialDates: SelfServeTrialDates
}

type PlatformLogParams = {
    platformId: string
    log: FastifyBaseLogger
}

type DeactivateTrialUsersAndInvitationsOverLimitParams = PlatformLogParams & {
    selfServeTrialDates: SelfServeTrialDates
}

type SeatsOverLimitParams = {
    platformId: string
    usersLimit: number | null | undefined
    billingEnforced: boolean
    log: FastifyBaseLogger
    entityManager?: EntityManager
}

type GetNewestTrialUserIdsParams = {
    platformId: string
    selfServeTrialDates: SelfServeTrialDates
    limit: number
    log: FastifyBaseLogger
    entityManager: EntityManager
}

type SeatsOverLimit = {
    activeUsers: number
    pendingInvitations: number
    usersLimit: number
    seatsOver: number
}

export const TRIAL_SEAT_GRACE_SWEEP_CRON = `${SWEEP_MINUTE_UTC} ${SWEEP_HOUR_UTC} * * *`

export const TRIAL_SEAT_GRACE_SWEEP_RETRY: JobsOptions = {
    attempts: 6,
    backoff: { type: 'fixed', delay: 60 * 60 * 1000 },
}
