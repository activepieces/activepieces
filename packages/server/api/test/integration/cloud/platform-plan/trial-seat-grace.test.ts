import { InvitationStatus, InvitationType, PlanName, PlatformRole, PrincipalType, SelfServeTrialDates, User, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { getBillingEnforcedKey, getBillingOverviewKey } from '../../../../src/app/database/redis/keys'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { autumnUtils } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { platformPlanRepo } from '../../../../src/app/ee/platform/platform-plan/platform-plan.service'
import { selfServeTrialUtils } from '../../../../src/app/ee/platform/platform-plan/self-serve-trial-utils'
import { trialSeatGrace } from '../../../../src/app/ee/platform/platform-plan/trial-seat-grace'
import { BillingOverview } from '../../../../src/app/platform/billing-provider'
import { userRepo } from '../../../../src/app/user/user-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockUserInvitation, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let log: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    log = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
})

describe('Seat grace after the self-serve trial', () => {
    it('runs while the trial has ended and users added during it are over the plan seats', async () => {
        const { platformId, dates, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3 })

        const plan = await platformPlanRepo().findOneByOrFail({ platformId })

        expect(await trialSeatGrace(log).getRunningGrace({ plan })).toEqual({
            usedSeats: 5,
            seatLimit: 3,
            userIds: [trialUsers[2].id, trialUsers[1].id],
        })
        const endsAt = dayjs(await trialSeatGrace(log).getGraceDeadline({ platformId, dates }))
        expect(endsAt.toISOString().slice(11)).toBe('15:30:00.000Z')
        expect(endsAt.isBefore(dayjs(dates.endsAt).add(7, 'day'))).toBe(false)
        expect(endsAt.isBefore(dayjs(dates.endsAt).add(8, 'day'))).toBe(true)
    })

    it('counts against the seats the plan has now, not a scheduled downgrade', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 3, trialUsers: 3 })
        await platformPlanRepo().update({ platformId }, { scheduledUsersLimit: 1 })

        const plan = await platformPlanRepo().findOneByOrFail({ platformId })

        expect(await trialSeatGrace(log).getRunningGrace({ plan })).toEqual({
            usedSeats: 4,
            seatLimit: 3,
            userIds: [trialUsers[2].id],
        })
    })

    it('shows nothing when the platform fits its plan', async () => {
        const { platformId, dates } = await setupPlatform({ usersLimit: 5, preTrialUsers: 1, trialUsers: 3 })

        const plan = await platformPlanRepo().findOneByOrFail({ platformId })

        expect(await trialSeatGrace(log).getRunningGrace({ plan })).toBeNull()
        expect(await trialSeatGrace(log).getGraceDeadline({ platformId, dates })).toBeNull()
    })

    it('shows nothing while the trial still runs', async () => {
        const { platformId } = await setupPlatform({ usersLimit: 1, trialUsers: 2 })
        const running = { startedAt: dayjs().subtract(2, 'day').toISOString(), endsAt: dayjs().add(5, 'day').toISOString() }
        await selfServeTrialUtils.cacheTrialDates({ platformId, dates: running })

        const plan = await platformPlanRepo().findOneByOrFail({ platformId })

        expect(await trialSeatGrace(log).getRunningGrace({ plan })).toBeNull()
        expect(await trialSeatGrace(log).getGraceDeadline({ platformId, dates: running })).toBeNull()
    })

    it('counts embedded users like any other user and can pick them', async () => {
        const { platformId, trialUsers, embeddedUsers } = await setupPlatform({ usersLimit: 2, trialUsers: 2, embeddedTrialUsers: 3 })

        const plan = await platformPlanRepo().findOneByOrFail({ platformId })

        expect(await trialSeatGrace(log).getRunningGrace({ plan })).toEqual({
            usedSeats: 6,
            seatLimit: 2,
            userIds: [embeddedUsers[2].id, embeddedUsers[1].id, embeddedUsers[0].id, trialUsers[1].id],
        })
    })

    it('stops showing once the platform fits again', async () => {
        const { platformId, dates, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3 })

        await deactivate([trialUsers[0], trialUsers[1]])

        const plan = await platformPlanRepo().findOneByOrFail({ platformId })
        expect(await trialSeatGrace(log).getRunningGrace({ plan })).toBeNull()
        expect(await trialSeatGrace(log).getGraceDeadline({ platformId, dates })).toBeNull()
    })

    it('deactivates the users added during the trial beyond the plan seats once the deadline passes', async () => {
        const { owner, preTrialUsers, trialUsers, embeddedUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, embeddedTrialUsers: 1, trialEndedDaysAgo: 8 })
        stubRefresh()

        await trialSeatGrace(log).sweep()

        for (const removed of [embeddedUsers[0], trialUsers[2], trialUsers[1]]) {
            expect(await statusOf(removed)).toBe(UserStatus.INACTIVE)
        }
        for (const kept of [owner, preTrialUsers[0], trialUsers[0]]) {
            expect(await statusOf(kept)).toBe(UserStatus.ACTIVE)
        }
    })

    it('counts again at the deadline and deactivates only the users still over the plan', async () => {
        const { preTrialUsers, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        await deactivate([preTrialUsers[0]])
        stubRefresh()

        await trialSeatGrace(log).sweep()

        expect(await statusOf(trialUsers[2])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(trialUsers[1])).toBe(UserStatus.ACTIVE)
        expect(await statusOf(trialUsers[0])).toBe(UserStatus.ACTIVE)
    })

    it('deactivates nobody when the plan gained seats before the deadline', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        await platformPlanRepo().update({ platformId }, { usersLimit: 10 })
        stubRefresh()

        await trialSeatGrace(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('deactivates nobody when billing is not enforced', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        await distributedStore.put(getBillingEnforcedKey(platformId), false, 300)
        stubRefresh()

        await trialSeatGrace(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('leaves a grace whose deadline has not come yet alone', async () => {
        const { trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2 })
        stubRefresh()

        await trialSeatGrace(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('leaves a deadline more than three days past alone', async () => {
        const { trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 12 })
        stubRefresh()

        await trialSeatGrace(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('never removes someone who joined after the trial ended, and picks trial users instead', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        const [laterJoiner] = await addUsers({ platformId, count: 1, firstCreatedAt: dayjs().subtract(1, 'day').toISOString() })
        stubRefresh()

        await trialSeatGrace(log).sweep()

        expect(await statusOf(laterJoiner)).toBe(UserStatus.ACTIVE)
        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.INACTIVE)
        }
    })

    it('waits for the deadline time on the deadline day', async () => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(todayAtUtc({ hour: 10 }))
        const { trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 7 })
        stubRefresh()

        await trialSeatGrace(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('refreshes a platform the trial left with unlimited seats, then ends its grace', async () => {
        const { platformId, owner, trialUsers } = await setupPlatform({ usersLimit: null, trialUsers: 2, trialEndedDaysAgo: 8 })
        await platformPlanRepo().update({ platformId }, { plan: PlanName.FREE })
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(async (_log, refreshed) => {
            if (refreshed === platformId) {
                await platformPlanRepo().update({ platformId }, { usersLimit: 1 })
            }
        })

        await trialSeatGrace(log).sweep()

        expect(await statusOf(trialUsers[1])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(trialUsers[0])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(owner)).toBe(UserStatus.ACTIVE)
    })

    it('counts the seats held by pending invitations when it ends a grace', async () => {
        const { platformId, owner, trialUsers } = await setupPlatform({ usersLimit: 2, trialUsers: 1, trialEndedDaysAgo: 8 })
        await db.save('user_invitation', createMockUserInvitation({
            platformId,
            type: InvitationType.PLATFORM,
            platformRole: PlatformRole.MEMBER,
            status: InvitationStatus.PENDING,
            updated: dayjs().toISOString(),
        }))
        stubRefresh()

        await trialSeatGrace(log).sweep()

        expect(await statusOf(trialUsers[0])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(owner)).toBe(UserStatus.ACTIVE)
    })

    it('skips a platform over its seats that never had a trial, without asking Autumn', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        await selfServeTrialUtils.cacheTrialDates({ platformId, dates: null })
        const refresh = stubRefresh()

        await trialSeatGrace(log).sweep()

        expect(refresh.mock.calls.some(([, refreshed]) => refreshed === platformId)).toBe(false)
        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('reads the cached trials of every platform over its seats in one go', async () => {
        const first = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        const second = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        stubRefresh()
        const getMany = vi.spyOn(distributedStore, 'getMany')
        const get = vi.spyOn(distributedStore, 'get')

        await trialSeatGrace(log).sweep()

        expect(getMany).toHaveBeenCalledTimes(1)
        expect(getMany.mock.calls[0][0]).toEqual(expect.arrayContaining([first.platformId, second.platformId].map((platformId) => `platform_plan:self-serve-trial:v2:${platformId}`)))
        expect(get.mock.calls.some(([key]) => key.startsWith('platform_plan:self-serve-trial:'))).toBe(false)
        expect(await statusOf(first.trialUsers[1])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(second.trialUsers[1])).toBe(UserStatus.INACTIVE)
    })

    it('reads the trial from Autumn when the cache has nothing, then ends the grace', async () => {
        const { platformId, dates, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        await selfServeTrialUtils.deleteCachedTrial(platformId)
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(async (_log, refreshed) => {
            if (refreshed === platformId) {
                await selfServeTrialUtils.cacheTrialDates({ platformId, dates })
            }
        })

        await trialSeatGrace(log).sweep()

        expect(await statusOf(trialUsers[2])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(trialUsers[1])).toBe(UserStatus.INACTIVE)
    })

    it('finishes the other deadlines when one fails, then fails the run so the job retries it', async () => {
        const failing = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        const passing = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(async (_log, platformId) => {
            if (platformId === failing.platformId) {
                throw new Error('autumn is down')
            }
        })

        await expect(trialSeatGrace(log).sweep()).rejects.toThrow('the sweep job retries them')

        expect(await statusOf(passing.trialUsers[2])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(failing.trialUsers[2])).toBe(UserStatus.ACTIVE)
    })

    it('lists the users who would be deactivated to a platform admin in the billing info', async () => {
        const { platformId, owner, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3 })
        await distributedStore.put(getBillingOverviewKey(platformId), FREE_OVERVIEW, 300)
        const token = await generateMockToken({ id: owner.id, type: PrincipalType.USER, platform: { id: platformId } })

        const response = await app!.inject({
            method: 'GET',
            url: '/api/v1/platform-billing/info',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().seatGrace).toEqual({ usedSeats: 5, seatLimit: 3, userIds: [trialUsers[2].id, trialUsers[1].id] })
    })

    it('keeps listing them when the billing info cannot tell whether billing is enforced', async () => {
        const { platformId, owner, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3 })
        await distributedStore.delete(getBillingEnforcedKey(platformId))
        await distributedStore.put(getBillingOverviewKey(platformId), FREE_OVERVIEW, 300)
        const token = await generateMockToken({ id: owner.id, type: PrincipalType.USER, platform: { id: platformId } })

        const response = await app!.inject({
            method: 'GET',
            url: '/api/v1/platform-billing/info',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response.json().seatGrace).toEqual({ usedSeats: 5, seatLimit: 3, userIds: [trialUsers[2].id, trialUsers[1].id] })
    })

    it('shows no grace while billing is known not to be enforced', async () => {
        const { platformId, dates } = await setupPlatform({ usersLimit: 1, trialUsers: 2 })
        await distributedStore.put(getBillingEnforcedKey(platformId), false, 300)

        const plan = await platformPlanRepo().findOneByOrFail({ platformId })

        expect(await trialSeatGrace(log).getRunningGrace({ plan })).toBeNull()
        expect(await trialSeatGrace(log).getGraceDeadline({ platformId, dates })).toBeNull()
    })

    it('tells every member the deadline on the platform while the grace runs', async () => {
        const { platformId, dates, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3 })
        const token = await generateMockToken({ id: trialUsers[0].id, type: PrincipalType.USER, platform: { id: platformId } })

        const response = await app!.inject({
            method: 'GET',
            url: `/api/v1/platforms/${platformId}`,
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().selfServeTrial).toEqual({
            ...dates,
            seatGraceEndsAt: await trialSeatGrace(log).getGraceDeadline({ platformId, dates }),
        })
        expect(response.json().selfServeTrial.seatGraceEndsAt).not.toBeNull()
    })
})

async function setupPlatform({ usersLimit, preTrialUsers = 0, trialUsers = 0, embeddedTrialUsers = 0, trialEndedDaysAgo = 3 }: SetupPlatformParams): Promise<SetupPlatformResult> {
    const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({ plan: { usersLimit, scheduledUsersLimit: null } })
    const dates = {
        startedAt: dayjs().subtract(trialEndedDaysAgo + 7, 'day').toISOString(),
        endsAt: dayjs().subtract(trialEndedDaysAgo, 'day').toISOString(),
    }
    await distributedStore.put(getBillingEnforcedKey(mockPlatform.id), true, 300)
    await selfServeTrialUtils.cacheTrialDates({ platformId: mockPlatform.id, dates })
    const duringTrial = dayjs(dates.startedAt).add(2, 'day').toISOString()
    return {
        platformId: mockPlatform.id,
        owner: mockOwner,
        dates,
        preTrialUsers: await addUsers({ platformId: mockPlatform.id, count: preTrialUsers, firstCreatedAt: dayjs(dates.startedAt).subtract(20, 'day').toISOString() }),
        trialUsers: await addUsers({ platformId: mockPlatform.id, count: trialUsers, firstCreatedAt: duringTrial }),
        embeddedUsers: await addUsers({ platformId: mockPlatform.id, count: embeddedTrialUsers, firstCreatedAt: dayjs(duringTrial).add(1, 'day').toISOString(), provider: UserIdentityProvider.JWT }),
    }
}

async function addUsers({ platformId, count, firstCreatedAt, provider = UserIdentityProvider.EMAIL }: AddUsersParams): Promise<User[]> {
    return Promise.all(Array.from({ length: count }, async (_, index) => {
        const { mockUser } = await mockBasicUser({
            userIdentity: { provider },
            user: {
                platformId,
                platformRole: PlatformRole.MEMBER,
                status: UserStatus.ACTIVE,
                created: dayjs(firstCreatedAt).add(index, 'hour').toISOString(),
            },
        })
        return mockUser
    }))
}

function todayAtUtc({ hour }: { hour: number }): Date {
    const moment = new Date()
    moment.setUTCHours(hour, 0, 0, 0)
    return moment
}

function stubRefresh() {
    return vi.spyOn(autumnUtils, 'refreshEntitlements').mockResolvedValue(undefined)
}

async function deactivate(users: User[]): Promise<void> {
    for (const user of users) {
        await userRepo().update({ id: user.id }, { status: UserStatus.INACTIVE })
    }
}

async function statusOf(user: User): Promise<UserStatus> {
    return (await userRepo().findOneByOrFail({ id: user.id })).status
}

const FREE_OVERVIEW: BillingOverview = {
    startDate: dayjs().toISOString(),
    endDate: dayjs().add(1, 'month').toISOString(),
    nextBillingAmount: 0,
    cancelAt: null,
    trialEndsAt: null,
    planName: 'Free',
    scheduledPlanName: null,
    billingPortalAvailable: false,
    creditsResetInterval: null,
    planInterval: null,
    creditsFeature: null,
    appSumoCreditsFeature: null,
    seatsFeature: null,
    includedSeats: null,
    additionalSeats: null,
    unavailable: false,
}

type SetupPlatformParams = {
    usersLimit: number | null
    preTrialUsers?: number
    trialUsers?: number
    embeddedTrialUsers?: number
    trialEndedDaysAgo?: number
}

type SetupPlatformResult = {
    platformId: string
    owner: User
    dates: SelfServeTrialDates
    preTrialUsers: User[]
    trialUsers: User[]
    embeddedUsers: User[]
}

type AddUsersParams = {
    platformId: string
    count: number
    firstCreatedAt: string
    provider?: UserIdentityProvider
}
