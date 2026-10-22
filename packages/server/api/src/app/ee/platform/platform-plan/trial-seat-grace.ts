import { isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { InvitationStatus, PlatformPlan, SELF_SERVE_TRIAL_PLANS, SelfServeTrialDates, TrialSeatGrace, UserStatus } from '@activepieces/shared'
import { JobsOptions } from 'bullmq'
import dayjs, { Dayjs } from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In, IsNull, SelectQueryBuilder } from 'typeorm'
import { transaction } from '../../../core/db/transaction'
import { getBillingEnforcedKey, getSelfServeTrialCacheKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { billingProvider } from '../../../platform/billing-provider'
import { UserSchema } from '../../../user/user-entity'
import { userRepo } from '../../../user/user-service'
import { getInvitationExpiryCutoff, userInvitationsService } from '../../../user-invitations/user-invitation.service'
import { platformPlanTelemetry } from './platform-plan-telemetry'
import { platformPlanRepo } from './platform-plan.service'
import { CachedSelfServeTrial, selfServeTrialUtils } from './self-serve-trial-utils'

const SEAT_GRACE_DAYS = 7
const SWEEP_HOUR_UTC = 15
const SWEEP_MINUTE_UTC = 30
const SWEEP_CATCH_UP_DAYS = 3

export const trialSeatGrace = (log: FastifyBaseLogger) => ({
    async getRunningGrace({ plan }: GetRunningGraceParams): Promise<TrialSeatGrace | null> {
        const dates = (await selfServeTrialUtils.readCachedTrial(plan.platformId))?.dates ?? null
        if (isNil(dates) || !isGraceRunning(dates)) {
            return null
        }
        return findTrialUsersBeyondSeatLimit({ platformId: plan.platformId, seatLimit: plan.usersLimit, dates, billingEnforced: await isBillingEnforcedOrUnknown(plan.platformId), log })
    },
    async getGraceDeadline({ platformId, dates }: GetGraceDeadlineParams): Promise<string | null> {
        if (!isGraceRunning(dates)) {
            return null
        }
        const plan = await platformPlanRepo().findOneBy({ platformId })
        const grace = await findTrialUsersBeyondSeatLimit({ platformId, seatLimit: plan?.usersLimit, dates, billingEnforced: await isBillingEnforcedOrUnknown(platformId), log })
        return isNil(grace) ? null : graceDeadline(dates).toISOString()
    },
    async sweep(): Promise<void> {
        const now = apDayjs()
        const failedPlatformIds = new Set<string>()
        for (const platformId of await findPlatformsStillWithUnlimitedTrialSeats()) {
            const { error } = await tryCatch(() => billingProvider.get(log).refreshEntitlements(platformId))
            if (!isNil(error)) {
                log.error({ error, platform: { id: platformId } }, 'Failed to refresh a platform still holding trial seats')
                failedPlatformIds.add(platformId)
            }
        }
        const candidates = await findPlatformsOverTheirSeats()
        const cachedTrials = await readCachedTrials(candidates)
        for (const platformId of candidates) {
            const { error } = await tryCatch(() => endGraceIfDue({ platformId, cached: cachedTrials.get(platformId), now, log }))
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

async function endGraceIfDue({ platformId, cached, now, log }: EndGraceIfDueParams): Promise<void> {
    const dates = isNil(cached) ? await fetchTrialDatesFromAutumn({ platformId, log }) : cached.dates
    if (isNil(dates) || !isGraceDue({ dates, now })) {
        return
    }
    await deactivateTrialUsersBeyondSeatLimit({ platformId, dates, log })
}

async function readCachedTrials(platformIds: string[]): Promise<Map<string, CachedSelfServeTrial>> {
    const cached = await distributedStore.getMany<CachedSelfServeTrial>(platformIds.map((platformId) => getSelfServeTrialCacheKey(platformId)))
    return new Map(platformIds.flatMap((platformId, index): [string, CachedSelfServeTrial][] => {
        const entry = cached[index]
        return isNil(entry) ? [] : [[platformId, entry]]
    }))
}

async function fetchTrialDatesFromAutumn({ platformId, log }: PlatformLogParams): Promise<SelfServeTrialDates | null> {
    await billingProvider.get(log).refreshEntitlements(platformId)
    return (await selfServeTrialUtils.readCachedTrial(platformId))?.dates ?? null
}

async function deactivateTrialUsersBeyondSeatLimit({ platformId, dates, log }: DeactivateTrialUsersBeyondSeatLimitParams): Promise<void> {
    await billingProvider.get(log).refreshEntitlements(platformId)
    const billingEnforced = await billingProvider.get(log).isBillingEnforced(platformId)
    const deactivated = await transaction(async (entityManager) => {
        const plan = await platformPlanRepo(entityManager)
            .createQueryBuilder('platform_plan')
            .setLock('pessimistic_write')
            .where('platform_plan.platformId = :platformId', { platformId })
            .getOneOrFail()
        await activeUsersQuery({ platformId, entityManager }).setLock('pessimistic_write').select('user.id').getMany()
        await userInvitationsService(log).lockSeatHoldingInvitations({ platformId, entityManager })
        const grace = await findTrialUsersBeyondSeatLimit({ platformId, seatLimit: plan.usersLimit, dates, billingEnforced, log, entityManager })
        const userIds = grace?.userIds ?? []
        if (userIds.length > 0) {
            await userRepo(entityManager).update({ id: In(userIds), platformId }, { status: UserStatus.INACTIVE })
        }
        return userIds.length
    })
    if (deactivated > 0) {
        rejectedPromiseHandler(platformPlanTelemetry(log).onTrialSeatsDeactivated({ platformId, deactivatedUsers: deactivated }), log)
    }
    log.info({ platform: { id: platformId }, seatGrace: { deactivatedCount: deactivated } }, 'Seat grace ended')
}

async function findPlatformsStillWithUnlimitedTrialSeats(): Promise<string[]> {
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
        .innerJoin(`(${ACTIVE_USER_COUNT_PER_PLATFORM})`, 'active_users', 'active_users."platformId" = platform_plan."platformId"')
        .leftJoin(`(${SEAT_HOLDING_INVITE_COUNT_PER_PLATFORM})`, 'invites', 'invites."platformId" = platform_plan."platformId"')
        .where('platform_plan.usersLimit IS NOT NULL')
        .andWhere('active_users.seats + COALESCE(invites.seats, 0) > platform_plan."usersLimit"')
        .setParameters({
            active: UserStatus.ACTIVE,
            reserving: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED],
            expiryCutoff: getInvitationExpiryCutoff(),
        })
        .getRawMany<{ platformId: string }>()
    return rows.map((row) => row.platformId)
}

async function findTrialUsersBeyondSeatLimit({ platformId, seatLimit, dates, billingEnforced, log, entityManager }: FindTrialUsersBeyondSeatLimitParams): Promise<TrialSeatGrace | null> {
    if (!billingEnforced || isNil(seatLimit)) {
        return null
    }
    const [activeUserCount, invitedSeats] = await Promise.all([
        activeUsersQuery({ platformId, entityManager }).getCount(),
        userInvitationsService(log).countReservedSeats({ platformId, entityManager }),
    ])
    const usedSeats = activeUserCount + invitedSeats
    const seatsOver = usedSeats - seatLimit
    if (seatsOver <= 0) {
        return null
    }
    const newestTrialUsersOverLimit = await activeUsersQuery({ platformId, entityManager })
        .andWhere('user.created >= :addedSince', { addedSince: dayjs(dates.startedAt).toISOString() })
        .andWhere('user.created <= :addedBefore', { addedBefore: dayjs(dates.endsAt).toISOString() })
        .andWhere(USER_IS_NOT_THE_PLATFORM_OWNER)
        .orderBy('user.created', 'DESC')
        .limit(seatsOver)
        .getMany()
    if (newestTrialUsersOverLimit.length === 0) {
        return null
    }
    return { usedSeats, seatLimit, userIds: newestTrialUsersOverLimit.map((user) => user.id) }
}

function graceDeadline(dates: SelfServeTrialDates): Dayjs {
    return firstSweepAtOrAfter(dayjs(dates.endsAt).add(SEAT_GRACE_DAYS, 'day'))
}

function isGraceRunning(dates: SelfServeTrialDates): boolean {
    const now = dayjs()
    return !dayjs(dates.endsAt).isAfter(now) && graceDeadline(dates).isAfter(now)
}

function isGraceDue({ dates, now }: IsGraceDueParams): boolean {
    const deadline = graceDeadline(dates)
    return !deadline.isAfter(now) && now.diff(deadline, 'day') <= SWEEP_CATCH_UP_DAYS
}

async function isBillingEnforcedOrUnknown(platformId: string): Promise<boolean> {
    return (await distributedStore.get<boolean>(getBillingEnforcedKey(platformId))) !== false
}

function firstSweepAtOrAfter(moment: Dayjs): Dayjs {
    const sameDaySweep = moment.utc().hour(SWEEP_HOUR_UTC).minute(SWEEP_MINUTE_UTC).second(0).millisecond(0)
    return sameDaySweep.isBefore(moment) ? sameDaySweep.add(1, 'day') : sameDaySweep
}

function activeUsersQuery({ platformId, entityManager }: ActiveUsersQueryParams): SelectQueryBuilder<UserSchema> {
    return userRepo(entityManager)
        .createQueryBuilder('user')
        .where('user.platformId = :platformId', { platformId })
        .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
}

const USER_IS_NOT_THE_PLATFORM_OWNER = `NOT EXISTS (
    SELECT 1
    FROM platform
    WHERE platform.id = "user"."platformId"
    AND platform."ownerId" = "user".id
)`

const ACTIVE_USER_COUNT_PER_PLATFORM = `SELECT "user"."platformId", COUNT(*) AS seats
    FROM "user"
    WHERE "user".status = :active
    GROUP BY "user"."platformId"`

const SEAT_HOLDING_INVITE_COUNT_PER_PLATFORM = `SELECT invitation."platformId", COUNT(*) AS seats
    FROM user_invitation invitation
    WHERE invitation.status IN (:...reserving)
    AND invitation.updated > :expiryCutoff
    GROUP BY invitation."platformId"`

type GetRunningGraceParams = {
    plan: PlatformPlan
}

type GetGraceDeadlineParams = {
    platformId: string
    dates: SelfServeTrialDates
}

type PlatformLogParams = {
    platformId: string
    log: FastifyBaseLogger
}

type EndGraceIfDueParams = PlatformLogParams & {
    cached: CachedSelfServeTrial | undefined
    now: Dayjs
}

type DeactivateTrialUsersBeyondSeatLimitParams = PlatformLogParams & {
    dates: SelfServeTrialDates
}

type IsGraceDueParams = {
    dates: SelfServeTrialDates
    now: Dayjs
}

type FindTrialUsersBeyondSeatLimitParams = {
    platformId: string
    seatLimit: number | null | undefined
    dates: SelfServeTrialDates
    billingEnforced: boolean
    log: FastifyBaseLogger
    entityManager?: EntityManager
}

type ActiveUsersQueryParams = {
    platformId: string
    entityManager?: EntityManager
}

export const TRIAL_SEAT_GRACE_SWEEP_CRON = `${SWEEP_MINUTE_UTC} ${SWEEP_HOUR_UTC} * * *`

export const TRIAL_SEAT_GRACE_SWEEP_RETRY: JobsOptions = {
    attempts: 6,
    backoff: { type: 'fixed', delay: 60 * 60 * 1000 },
}
