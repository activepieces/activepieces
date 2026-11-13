import { apId, chunk, InvitationStatus, InvitationType, isNil, PlanName, PlatformRole, PrincipalType, SelfServeTrialDates, SelfServeTrialState, tryCatch, User, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { transaction } from '../../../../src/app/core/db/transaction'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { getBillingEnforcedKey } from '../../../../src/app/database/redis/keys'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { autumnConsole, autumnUtils } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { platformPlanRepo, platformPlanService } from '../../../../src/app/ee/platform/platform-plan/platform-plan.service'
import { selfServeTrialUtils } from '../../../../src/app/ee/platform/platform-plan/self-serve-trial-utils'
import { trialSeatCleanup } from '../../../../src/app/ee/platform/platform-plan/trial-seat-cleanup'
import { mcpGrantRevocation } from '../../../../src/app/mcp/oauth/token/mcp-grant-revocation'
import { userRepo } from '../../../../src/app/user/user-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockProject, createMockUser, createMockUserIdentity, createMockUserInvitation, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let log: FastifyBaseLogger
let trialDatesInAutumn: Map<string, SelfServeTrialDates | null>

beforeAll(async () => {
    app = await setupTestEnvironment()
    log = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    trialDatesInAutumn = new Map()
    vi.spyOn(autumnUtils, 'readSelfServeTrialDates').mockImplementation(async (_log, platformId) => trialDatesInAutumn.get(platformId) ?? null)
    vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
})

afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
})

describe('Seat grace after the self-serve trial', () => {
    it('runs while the trial has ended and users added during it are over the plan seats', async () => {
        const { platformId, selfServeTrialDates } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3 })

        const endsAt = dayjs(await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates }))
        expect(endsAt.toISOString().slice(11)).toBe('15:30:00.000Z')
        expect(endsAt.isBefore(dayjs(selfServeTrialDates.endsAt).add(7, 'day'))).toBe(false)
        expect(endsAt.isBefore(dayjs(selfServeTrialDates.endsAt).add(8, 'day'))).toBe(true)
    })

    it('counts against the seats the plan has now, not a scheduled downgrade', async () => {
        const { platformId, selfServeTrialDates } = await setupPlatform({ usersLimit: 4, trialUsers: 3 })
        await platformPlanRepo().update({ platformId }, { scheduledUsersLimit: 1 })

        expect(await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates })).toBeNull()
    })

    it('shows nothing when the platform fits its plan', async () => {
        const { platformId, selfServeTrialDates } = await setupPlatform({ usersLimit: 5, preTrialUsers: 1, trialUsers: 3 })

        expect(await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates })).toBeNull()
    })

    it('shows nothing while the trial still runs', async () => {
        const { platformId } = await setupPlatform({ usersLimit: 1, trialUsers: 2 })
        const running = { startedAt: dayjs().subtract(2, 'day').toISOString(), endsAt: dayjs().add(5, 'day').toISOString() }
        await selfServeTrialUtils.cacheTrialDates({ platformId, dates: running })

        expect(await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates: running })).toBeNull()
    })

    it('counts embedded users like any other user', async () => {
        const { platformId, selfServeTrialDates } = await setupPlatform({ usersLimit: 3, embeddedTrialUsers: 3 })

        expect(await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates })).not.toBeNull()
    })

    it('stops showing once the platform fits again', async () => {
        const { platformId, selfServeTrialDates, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3 })

        await deactivate([trialUsers[0], trialUsers[1]])

        expect(await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates })).toBeNull()
    })

    it('deactivates the users added during the trial beyond the plan seats once the deadline passes', async () => {
        const { owner, preTrialUsers, trialUsers, embeddedUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, embeddedTrialUsers: 1, trialEndedDaysAgo: 8 })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        for (const removed of [embeddedUsers[0], trialUsers[2], trialUsers[1]]) {
            expect(await statusOf(removed)).toBe(UserStatus.INACTIVE)
        }
        for (const kept of [owner, preTrialUsers[0], trialUsers[0]]) {
            expect(await statusOf(kept)).toBe(UserStatus.ACTIVE)
        }
    })

    it('revokes the MCP grants of the users it deactivates, and of no one else', async () => {
        const { platformId, owner, trialUsers } = await setupPlatform({ usersLimit: 2, trialUsers: 2, trialEndedDaysAgo: 8 })
        const grants = await saveMcpGrants({ platformId, users: [owner, ...trialUsers] })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(await isRevoked(grants[trialUsers[1].id])).toBe(true)
        expect(await isRevoked(grants[trialUsers[0].id])).toBe(false)
        expect(await isRevoked(grants[owner.id])).toBe(false)
    })

    it('keeps the MCP grants when the deactivation rolls back', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 2, trialUsers: 2, trialEndedDaysAgo: 8 })
        const grants = await saveMcpGrants({ platformId, users: trialUsers })
        vi.spyOn(mcpGrantRevocation, 'revokeUsersActiveGrantsInTransaction').mockRejectedValue(new Error('grant table unavailable'))
        stubRefresh()

        await expect(trialSeatCleanup(log).sweep()).rejects.toThrow('the sweep job retries them')

        expect(await statusOf(trialUsers[1])).toBe(UserStatus.ACTIVE)
        expect(await isRevoked(grants[trialUsers[1].id])).toBe(false)
    })

    it('counts again at the deadline and deactivates only the users still over the plan', async () => {
        const { preTrialUsers, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        await deactivate([preTrialUsers[0]])
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(await statusOf(trialUsers[2])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(trialUsers[1])).toBe(UserStatus.ACTIVE)
        expect(await statusOf(trialUsers[0])).toBe(UserStatus.ACTIVE)
    })

    it('deactivates nobody when the plan gained seats before the deadline', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        await platformPlanRepo().update({ platformId }, { usersLimit: 10 })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('deactivates nobody when billing is not enforced', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        await distributedStore.put(getBillingEnforcedKey(platformId), false, 300)
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('leaves a grace whose deadline has not come yet alone', async () => {
        const { trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2 })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('still deactivates the users over the plan when the deadline passed days ago', async () => {
        const { trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 30 })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.INACTIVE)
        }
    })

    it('never removes someone who joined after the trial ended, and picks trial users instead', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        const [laterJoiner] = await addUsers({ platformId, count: 1, firstCreatedAt: dayjs().subtract(1, 'day').toISOString() })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

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

        await trialSeatCleanup(log).sweep()

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

        await trialSeatCleanup(log).sweep()

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

        await trialSeatCleanup(log).sweep()

        expect(await statusOf(trialUsers[0])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(owner)).toBe(UserStatus.ACTIVE)
    })

    it('counts pending invitations toward the seats while the grace runs', async () => {
        const { platformId, selfServeTrialDates } = await setupPlatform({ usersLimit: 2, trialUsers: 1 })
        await saveInvitation({ platformId, created: dayjs(selfServeTrialDates.startedAt).add(3, 'day').toISOString() })

        expect(await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates })).not.toBeNull()
    })

    it('revokes the invitations sent during the trial before it deactivates anyone', async () => {
        const { platformId, selfServeTrialDates, trialUsers } = await setupPlatform({ usersLimit: 2, trialUsers: 1, trialEndedDaysAgo: 8 })
        const trialInvite = await saveInvitation({ platformId, created: dayjs(selfServeTrialDates.startedAt).add(3, 'day').toISOString() })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(await db.findOneBy('user_invitation', { id: trialInvite.id })).toBeNull()
        expect(await statusOf(trialUsers[0])).toBe(UserStatus.ACTIVE)
    })

    it('deactivates trial users for the seats the revoked invitations do not free', async () => {
        const { platformId, selfServeTrialDates, owner, trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 1, trialEndedDaysAgo: 8 })
        const trialInvite = await saveInvitation({ platformId, created: dayjs(selfServeTrialDates.startedAt).add(3, 'day').toISOString() })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(await db.findOneBy('user_invitation', { id: trialInvite.id })).toBeNull()
        expect(await statusOf(trialUsers[0])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(owner)).toBe(UserStatus.ACTIVE)
    })

    it('keeps an invitation sent before the trial', async () => {
        const { platformId, selfServeTrialDates, trialUsers } = await setupPlatform({ usersLimit: 2, trialUsers: 1, trialEndedDaysAgo: 8 })
        const earlierInvite = await saveInvitation({ platformId, created: dayjs(selfServeTrialDates.startedAt).subtract(1, 'day').toISOString() })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(await db.findOneBy('user_invitation', { id: earlierInvite.id })).not.toBeNull()
        expect(await statusOf(trialUsers[0])).toBe(UserStatus.INACTIVE)
    })

    it('keeps every invitation of someone first invited before the trial, even one sent during it', async () => {
        const { platformId, selfServeTrialDates, trialUsers } = await setupPlatform({ usersLimit: 2, trialUsers: 1, trialEndedDaysAgo: 8 })
        const email = 'invited-before-the-trial@example.com'
        const earlierInvite = await saveInvitation({ platformId, email, created: dayjs(selfServeTrialDates.startedAt).subtract(1, 'day').toISOString() })
        const trialInvite = await saveInvitation({ platformId, email, created: dayjs(selfServeTrialDates.startedAt).add(3, 'day').toISOString() })
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(await db.findOneBy('user_invitation', { id: earlierInvite.id })).not.toBeNull()
        expect(await db.findOneBy('user_invitation', { id: trialInvite.id })).not.toBeNull()
        expect(await statusOf(trialUsers[0])).toBe(UserStatus.INACTIVE)
    })

    it('counts one seat for someone invited twice, so a platform that fits its seats is left alone', async () => {
        const { platformId, selfServeTrialDates, trialUsers } = await setupPlatform({ usersLimit: 3, trialUsers: 1, trialEndedDaysAgo: 8 })
        const email = 'invited-twice@example.com'
        await saveInvitation({ platformId, email, created: dayjs(selfServeTrialDates.startedAt).add(2, 'day').toISOString() })
        await saveInvitation({ platformId, email, created: dayjs(selfServeTrialDates.startedAt).add(3, 'day').toISOString() })
        const refresh = stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(refresh.mock.calls.some(([, refreshed]) => refreshed === platformId)).toBe(false)
        expect(await statusOf(trialUsers[0])).toBe(UserStatus.ACTIVE)
    })

    it('skips a platform over its seats whose subscriptions show no trial, without refreshing it', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        trialDatesInAutumn.set(platformId, null)
        const refresh = stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(refresh.mock.calls.some(([, refreshed]) => refreshed === platformId)).toBe(false)
        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('ends the grace from the trial dates in Autumn when nothing is cached', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        await selfServeTrialUtils.deleteCachedTrial(platformId)
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        expect(await statusOf(trialUsers[2])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(trialUsers[1])).toBe(UserStatus.INACTIVE)
    })

    it('ignores cached trial dates that Autumn no longer lists', async () => {
        const { platformId, trialUsers } = await setupPlatform({ usersLimit: 1, trialUsers: 2, trialEndedDaysAgo: 8 })
        trialDatesInAutumn.set(platformId, null)
        stubRefresh()

        await trialSeatCleanup(log).sweep()

        for (const user of trialUsers) {
            expect(await statusOf(user)).toBe(UserStatus.ACTIVE)
        }
    })

    it('deactivates nobody when Autumn cannot list the trial, then fails the run so the job retries it', async () => {
        const failing = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        const passing = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        vi.spyOn(autumnUtils, 'readSelfServeTrialDates').mockImplementation(async (_log, platformId) => {
            if (platformId === failing.platformId) {
                throw new Error('autumn is down')
            }
            return trialDatesInAutumn.get(platformId) ?? null
        })
        stubRefresh()

        await expect(trialSeatCleanup(log).sweep()).rejects.toThrow('the sweep job retries them')

        expect(await statusOf(passing.trialUsers[2])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(failing.trialUsers[2])).toBe(UserStatus.ACTIVE)
    })

    it('finishes the other deadlines when one fails, then fails the run so the job retries it', async () => {
        const failing = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        const passing = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3, trialEndedDaysAgo: 8 })
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(async (_log, platformId) => {
            if (platformId === failing.platformId) {
                throw new Error('autumn is down')
            }
        })

        await expect(trialSeatCleanup(log).sweep()).rejects.toThrow('the sweep job retries them')

        expect(await statusOf(passing.trialUsers[2])).toBe(UserStatus.INACTIVE)
        expect(await statusOf(failing.trialUsers[2])).toBe(UserStatus.ACTIVE)
    })

    it('shows no grace while billing is known not to be enforced', async () => {
        const { platformId, selfServeTrialDates } = await setupPlatform({ usersLimit: 1, trialUsers: 2 })
        await distributedStore.put(getBillingEnforcedKey(platformId), false, 300)

        expect(await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates })).toBeNull()
    })

    it('tells every member the deadline on the platform while the grace runs', async () => {
        const { platformId, selfServeTrialDates, trialUsers } = await setupPlatform({ usersLimit: 3, preTrialUsers: 1, trialUsers: 3 })
        const token = await generateMockToken({ id: trialUsers[0].id, type: PrincipalType.USER, platform: { id: platformId } })

        const response = await app!.inject({
            method: 'GET',
            url: `/api/v1/platforms/${platformId}`,
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().selfServeTrial).toEqual({
            state: SelfServeTrialState.ENDED,
            ...selfServeTrialDates,
            seatGraceEndsAt: await trialSeatCleanup(log).endsAt({ platformId, selfServeTrialDates }),
        })
        expect(response.json().selfServeTrial.seatGraceEndsAt).not.toBeNull()
    })
})

describe.runIf(process.env.AP_DB_TYPE === 'POSTGRES' && process.env.AP_TRIAL_SEAT_CLEANUP_BENCHMARK === 'true')('Seat grace cleanup under load', () => {
    it.each([1_000, 10_000])('measures how long a platform with %i trial users stays locked', async (count) => {
        const { platformId, selfServeTrialDates } = await setupPlatform({ usersLimit: 10, trialEndedDaysAgo: 8 })
        const [keptUser] = await addUsers({ platformId, count: 1, firstCreatedAt: dayjs(selfServeTrialDates.startedAt).subtract(20, 'day').toISOString() })
        await bulkAddTrialSeats({ platformId, count, firstCreatedAt: dayjs(selfServeTrialDates.startedAt).add(1, 'day').toISOString() })
        stubRefresh()

        const sweepStartedAt = performance.now()
        const sweep = trialSeatCleanup(log).sweep()
        const lockedAt = await waitUntilPlanIsLocked(platformId)
        const [adminDeactivationWaitMs, ownedProjectInsertWaitMs, inviteSeatCheckWaitMs] = await Promise.all([
            msSince({ from: lockedAt, until: userRepo().update({ id: keptUser.id }, { externalId: apId() }) }),
            msSince({ from: lockedAt, until: db.save('project', createMockProject({ platformId, ownerId: keptUser.id })) }),
            msSince({ from: lockedAt, until: tryCatch(() => transaction((entityManager) => platformPlanService(log).checkUsersExceededLimit({ platformId, entityManager }))) }),
        ])
        await sweep
        const sweepMs = performance.now() - sweepStartedAt

        process.stdout.write(`${JSON.stringify({ trialUsers: count, trialInvites: count / 10, sweepMs: Math.round(sweepMs), adminDeactivationWaitMs, ownedProjectInsertWaitMs, inviteSeatCheckWaitMs })}\n`)
        expect(await statusOf(keptUser)).toBe(UserStatus.ACTIVE)
    }, 300_000)
})

async function bulkAddTrialSeats({ platformId, count, firstCreatedAt }: AddUsersParams): Promise<void> {
    const identities = Array.from({ length: count }, () => createMockUserIdentity({ verified: true }))
    const users = identities.map((identity, index) => createMockUser({
        identityId: identity.id,
        platformId,
        platformRole: PlatformRole.MEMBER,
        status: UserStatus.ACTIVE,
        created: dayjs(firstCreatedAt).add(index, 'second').toISOString(),
    }))
    const invitations = Array.from({ length: count / 10 }, (_, index) => createMockUserInvitation({
        platformId,
        type: InvitationType.PLATFORM,
        platformRole: PlatformRole.MEMBER,
        status: InvitationStatus.PENDING,
        created: dayjs(firstCreatedAt).add(index, 'second').toISOString(),
        updated: dayjs().toISOString(),
    }))
    for (const batch of chunk(identities, 1_000)) {
        await databaseConnection().getRepository('user_identity').insert(batch)
    }
    for (const batch of chunk(users, 1_000)) {
        await userRepo().insert(batch)
    }
    for (const batch of chunk(invitations, 1_000)) {
        await databaseConnection().getRepository('user_invitation').insert(batch)
    }
}

async function waitUntilPlanIsLocked(platformId: string): Promise<number> {
    const { error } = await tryCatch(() => databaseConnection().query('SELECT 1 FROM platform_plan WHERE "platformId" = $1 FOR UPDATE NOWAIT', [platformId]))
    if (!isNil(error)) {
        return performance.now()
    }
    await new Promise((resolve) => setTimeout(resolve, 1))
    return waitUntilPlanIsLocked(platformId)
}

async function msSince({ from, until }: { from: number, until: Promise<unknown> }): Promise<number> {
    await until
    return Math.round(performance.now() - from)
}

async function setupPlatform({ usersLimit, preTrialUsers = 0, trialUsers = 0, embeddedTrialUsers = 0, trialEndedDaysAgo = 3 }: SetupPlatformParams): Promise<SetupPlatformResult> {
    const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({ plan: { usersLimit, scheduledUsersLimit: null } })
    const selfServeTrialDates = {
        startedAt: dayjs().subtract(trialEndedDaysAgo + 7, 'day').toISOString(),
        endsAt: dayjs().subtract(trialEndedDaysAgo, 'day').toISOString(),
    }
    await distributedStore.put(getBillingEnforcedKey(mockPlatform.id), true, 300)
    await selfServeTrialUtils.cacheTrialDates({ platformId: mockPlatform.id, dates: selfServeTrialDates })
    trialDatesInAutumn.set(mockPlatform.id, selfServeTrialDates)
    const duringTrial = dayjs(selfServeTrialDates.startedAt).add(2, 'day').toISOString()
    return {
        platformId: mockPlatform.id,
        owner: mockOwner,
        selfServeTrialDates,
        preTrialUsers: await addUsers({ platformId: mockPlatform.id, count: preTrialUsers, firstCreatedAt: dayjs(selfServeTrialDates.startedAt).subtract(20, 'day').toISOString() }),
        trialUsers: await addUsers({ platformId: mockPlatform.id, count: trialUsers, firstCreatedAt: duringTrial }),
        embeddedUsers: await addUsers({ platformId: mockPlatform.id, count: embeddedTrialUsers, firstCreatedAt: dayjs(duringTrial).add(1, 'day').toISOString(), provider: UserIdentityProvider.JWT }),
    }
}

async function saveInvitation({ platformId, created, email }: SaveInvitationParams): Promise<{ id: string }> {
    const invitation = createMockUserInvitation({
        platformId,
        email,
        type: InvitationType.PLATFORM,
        platformRole: PlatformRole.MEMBER,
        status: InvitationStatus.PENDING,
        created,
        updated: dayjs().toISOString(),
    })
    await db.save('user_invitation', invitation)
    return invitation
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

async function saveMcpGrants({ platformId, users }: { platformId: string, users: User[] }): Promise<Record<string, string>> {
    const grants = users.map((user) => ({
        id: apId(),
        refreshToken: apId(),
        clientId: apId(),
        userId: user.id,
        platformId,
        expiresAt: dayjs().add(30, 'day').toISOString(),
        revoked: false,
    }))
    await db.save('mcp_oauth_token', grants)
    return Object.fromEntries(grants.map((grant) => [grant.userId, grant.id]))
}

async function isRevoked(grantId: string): Promise<boolean> {
    return (await db.findOneByOrFail<{ revoked: boolean }>('mcp_oauth_token', { id: grantId })).revoked
}

type SaveInvitationParams = {
    platformId: string
    created: string
    email?: string
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
    selfServeTrialDates: SelfServeTrialDates
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
