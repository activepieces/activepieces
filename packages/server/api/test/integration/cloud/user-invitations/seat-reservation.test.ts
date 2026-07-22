import { ErrorCode, PlatformUsageMetric } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, Platform, PlatformRole, PrincipalType, Project, User, UserStatus } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { getBillingEnforcedKey } from '../../../../src/app/database/redis/keys'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { assertSeatsNotBelowActiveUsers } from '../../../../src/app/ee/platform/platform-plan/platform-plan.service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockUserInvitation,
    mockAndSaveBasicSetupWithApiKey,
    mockBasicUser,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    emailService(mockLog).sendInvitation = vi.fn()
})

describe('Seat reservation (ADR-0010) + active-user floor (ADR-0009)', () => {
    describe('Seat reservation on invite', () => {
        it('allows inviting when under the seat limit', async () => {
            const { mockOwnerToken, mockProject } = await setupPlatform({ usersLimit: 3 })

            const response = await invite({
                token: mockOwnerToken,
                projectId: mockProject.id,
                email: faker.internet.email().toLowerCase(),
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('counts pending invitations toward the seat limit', async () => {
            const { mockOwnerToken, mockPlatform, mockProject } = await setupPlatform({ usersLimit: 2 })
            await seedInvitation({ platformId: mockPlatform.id, status: InvitationStatus.PENDING })

            const response = await invite({
                token: mockOwnerToken,
                projectId: mockProject.id,
                email: faker.internet.email().toLowerCase(),
            })

            expectSeatQuotaExceeded(response)
        })

        it('does not consume a seat when inviting an existing platform member', async () => {
            const { mockOwnerToken, mockProject, ownerEmail } = await setupPlatform({ usersLimit: 1 })

            const response = await invite({
                token: mockOwnerToken,
                projectId: mockProject.id,
                email: ownerEmail,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('does not double-count when re-inviting an already-reserved email', async () => {
            const { mockOwnerToken, mockPlatform, mockProject } = await setupPlatform({ usersLimit: 2 })
            const reservedEmail = faker.internet.email().toLowerCase()
            await seedInvitation({ platformId: mockPlatform.id, status: InvitationStatus.PENDING, email: reservedEmail })

            const reInvite = await invite({ token: mockOwnerToken, projectId: mockProject.id, email: reservedEmail })
            expect(reInvite?.statusCode).toBe(StatusCodes.CREATED)

            const newEmailInvite = await invite({ token: mockOwnerToken, projectId: mockProject.id, email: faker.internet.email().toLowerCase() })
            expectSeatQuotaExceeded(newEmailInvite)
        })

        it('excludes expired pending invitations from the seat count', async () => {
            const { mockOwnerToken, mockPlatform, mockProject } = await setupPlatform({ usersLimit: 2 })
            await seedInvitation({ platformId: mockPlatform.id, status: InvitationStatus.PENDING, createdDaysAgo: 8 })

            const response = await invite({
                token: mockOwnerToken,
                projectId: mockProject.id,
                email: faker.internet.email().toLowerCase(),
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('counts accepted-but-not-yet-provisioned invitations toward the seat limit', async () => {
            const { mockOwnerToken, mockPlatform, mockProject } = await setupPlatform({ usersLimit: 2 })
            await seedInvitation({ platformId: mockPlatform.id, status: InvitationStatus.ACCEPTED })

            const response = await invite({
                token: mockOwnerToken,
                projectId: mockProject.id,
                email: faker.internet.email().toLowerCase(),
            })

            expectSeatQuotaExceeded(response)
        })

        it('blocks an API-key auto-accept invite once accepted invites fill the seats', async () => {
            const { mockApiKey, mockPlatform, mockProject } = await setupPlatform({ usersLimit: 2 })
            await seedInvitation({ platformId: mockPlatform.id, status: InvitationStatus.ACCEPTED })

            const response = await invite({
                apiKey: mockApiKey.value,
                projectId: mockProject.id,
                email: faker.internet.email().toLowerCase(),
            })

            expectSeatQuotaExceeded(response)
        })
    })

    describe('Seat reservation on reactivation', () => {
        it('blocks reactivating a user when at the seat limit', async () => {
            const { mockOwnerToken, mockPlatform } = await setupPlatform({ usersLimit: 1 })
            const inactiveMember = await createInactiveMember(mockPlatform.id)

            const response = await reactivate({ token: mockOwnerToken, userId: inactiveMember.id })

            expectSeatQuotaExceeded(response)
        })

        it('allows reactivation when a seat is available', async () => {
            const { mockOwnerToken, mockPlatform } = await setupPlatform({ usersLimit: 2 })
            const inactiveMember = await createInactiveMember(mockPlatform.id)

            const response = await reactivate({ token: mockOwnerToken, userId: inactiveMember.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Scheduled seat cap (ADR-0013)', () => {
        it('blocks inviting past the scheduled cap even when under the current limit', async () => {
            const { mockOwnerToken, mockProject } = await setupPlatform({ usersLimit: 5, scheduledUsersLimit: 1 })

            const response = await invite({
                token: mockOwnerToken,
                projectId: mockProject.id,
                email: faker.internet.email().toLowerCase(),
            })

            expectSeatQuotaExceeded(response)
        })

        it('blocks reactivating a user past the scheduled cap', async () => {
            const { mockOwnerToken, mockPlatform } = await setupPlatform({ usersLimit: 5, scheduledUsersLimit: 1 })
            const inactiveMember = await createInactiveMember(mockPlatform.id)

            const response = await reactivate({ token: mockOwnerToken, userId: inactiveMember.id })

            expectSeatQuotaExceeded(response)
        })

        it('allows seat use up to the scheduled cap', async () => {
            const { mockOwnerToken, mockProject } = await setupPlatform({ usersLimit: 5, scheduledUsersLimit: 3 })

            const response = await invite({
                token: mockOwnerToken,
                projectId: mockProject.id,
                email: faker.internet.email().toLowerCase(),
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })
    })

    describe('Active-user floor (assertSeatsNotBelowActiveUsers)', () => {
        it('rejects a target seat limit below used seats (active + reserved)', async () => {
            const { mockPlatform } = await setupPlatform({ usersLimit: 5 })
            await seedInvitation({ platformId: mockPlatform.id, status: InvitationStatus.PENDING })

            await expect(
                assertSeatsNotBelowActiveUsers({ platformId: mockPlatform.id, targetLimit: 1, log: mockLog }),
            ).rejects.toMatchObject({ error: { code: ErrorCode.QUOTA_EXCEEDED, params: { metric: PlatformUsageMetric.USERS } } })
        })

        it('accepts a target seat limit equal to used seats', async () => {
            const { mockPlatform } = await setupPlatform({ usersLimit: 5 })
            await seedInvitation({ platformId: mockPlatform.id, status: InvitationStatus.PENDING })

            await expect(
                assertSeatsNotBelowActiveUsers({ platformId: mockPlatform.id, targetLimit: 2, log: mockLog }),
            ).resolves.toBeUndefined()
        })
    })
})

async function setupPlatform({ usersLimit, scheduledUsersLimit = null }: { usersLimit: number, scheduledUsersLimit?: number | null }): Promise<{
    mockOwner: User
    mockPlatform: Platform
    mockProject: Project
    mockApiKey: { value: string }
    mockOwnerToken: string
    ownerEmail: string
}> {
    const ownerEmail = faker.internet.email().toLowerCase()
    const { mockOwner, mockPlatform, mockProject, mockApiKey } = await mockAndSaveBasicSetupWithApiKey({
        userIdentity: { email: ownerEmail },
        plan: { usersLimit, scheduledUsersLimit, projectRolesEnabled: true, auditLogEnabled: false },
    })
    await distributedStore.put(getBillingEnforcedKey(mockPlatform.id), true, 300)
    const mockOwnerToken = await generateMockToken({
        id: mockOwner.id,
        type: PrincipalType.USER,
        platform: { id: mockPlatform.id },
    })
    return { mockOwner, mockPlatform, mockProject, mockApiKey, mockOwnerToken, ownerEmail }
}

async function createInactiveMember(platformId: string): Promise<User> {
    const { mockUser } = await mockBasicUser({
        user: {
            platformId,
            platformRole: PlatformRole.MEMBER,
            status: UserStatus.INACTIVE,
        },
    })
    return mockUser
}

async function seedInvitation({ platformId, status, email, createdDaysAgo = 0 }: {
    platformId: string
    status: InvitationStatus
    email?: string
    createdDaysAgo?: number
}): Promise<void> {
    const invitation = createMockUserInvitation({
        email: email ?? faker.internet.email().toLowerCase(),
        platformId,
        type: InvitationType.PLATFORM,
        platformRole: PlatformRole.ADMIN,
        status,
    })
    await db.save('user_invitation', invitation)
    if (createdDaysAgo > 0) {
        await databaseConnection().query(
            'UPDATE user_invitation SET created = $1 WHERE id = $2',
            [dayjs().subtract(createdDaysAgo, 'day').toISOString(), invitation.id],
        )
    }
}

function invite({ token, apiKey, email, projectId }: {
    token?: string
    apiKey?: string
    email: string
    projectId: string
}): ReturnType<NonNullable<typeof app>['inject']> {
    return app!.inject({
        method: 'POST',
        url: '/api/v1/user-invitations',
        headers: { authorization: `Bearer ${token ?? apiKey}` },
        query: { projectId },
        body: {
            email,
            type: InvitationType.PLATFORM,
            platformRole: PlatformRole.ADMIN,
        },
    })
}

function reactivate({ token, userId }: { token: string, userId: string }): ReturnType<NonNullable<typeof app>['inject']> {
    return app!.inject({
        method: 'POST',
        url: `/api/v1/users/${userId}`,
        headers: { authorization: `Bearer ${token}` },
        body: { status: UserStatus.ACTIVE },
    })
}

function expectSeatQuotaExceeded(response: Awaited<ReturnType<NonNullable<typeof app>['inject']>> | undefined): void {
    expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    const body = response?.json()
    expect(body?.code).toBe(ErrorCode.QUOTA_EXCEEDED)
    expect(body?.params?.metric).toBe(PlatformUsageMetric.USERS)
}
