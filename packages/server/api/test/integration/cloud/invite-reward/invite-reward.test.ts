import { apId } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { inviteRewardService } from '../../../../src/app/ee/invite-reward/invite-reward.service'
import { autumnConsole } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { systemJobsSchedule } from '../../../../src/app/helper/system-jobs/system-job'
import { billingProvider } from '../../../../src/app/platform/billing-provider'
import { userInvitationsService } from '../../../../src/app/user-invitations/user-invitation.service'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUserIdentity, mockAndSaveBasicSetup } from '../../../helpers/mocks'
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

beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue(CREDS)
    vi.spyOn(autumnConsole, 'grantInviteReward').mockResolvedValue({ granted: true, credits: 1000, rewardsEarned: 1 })
    mockProvider({})
})

describe('Invite reward', () => {
    describe('when an invited person joins', () => {
        it('asks the console to reward the new member, naming the invitee', async () => {
            const { mockPlatform } = await setupPlatform()

            const email = await joinAsNewMember({ platformId: mockPlatform.id })

            await vi.waitFor(() => expect(autumnConsole.grantInviteReward).toHaveBeenCalledExactlyOnceWith({ autumnCustomerId: CREDS.autumnCustomerId, inviteeEmail: email }))
        })

        it('refreshes the balance after the console grants', async () => {
            const { mockPlatform } = await setupPlatform()
            const refresh = mockRefresh()

            await joinAsNewMember({ platformId: mockPlatform.id })

            await vi.waitFor(() => expect(refresh).toHaveBeenCalledWith(mockPlatform.id))
        })

        it('does not refresh the balance when the console grants nothing', async () => {
            const { mockPlatform } = await setupPlatform()
            const refresh = mockRefresh()
            vi.mocked(autumnConsole.grantInviteReward).mockResolvedValue({ granted: false, reason: 'already_rewarded' })

            await joinAsNewMember({ platformId: mockPlatform.id })

            await vi.waitFor(() => expect(autumnConsole.grantInviteReward).toHaveBeenCalledTimes(1))
            expect(refresh).not.toHaveBeenCalled()
        })

        it('does not ask for a reward when someone already on the platform accepts again', async () => {
            const { mockPlatform, mockOwner } = await setupPlatform()
            const owner = await databaseConnection().getRepository('user_identity').findOneByOrFail({ id: mockOwner.identityId })

            await provisionInvite({ email: owner.email, platformId: mockPlatform.id })

            await new Promise((resolve) => setTimeout(resolve, 200))
            expect(autumnConsole.grantInviteReward).not.toHaveBeenCalled()
        })

        it('still grants when the member is removed before the job runs', async () => {
            const { mockPlatform } = await setupPlatform()
            const identity = createMockUserIdentity({ verified: true })
            await databaseConnection().getRepository('user_identity').save(identity)

            await inviteRewardService(mockLog).grantOnJoin({ platformId: mockPlatform.id, identityId: identity.id })

            expect(autumnConsole.grantInviteReward).toHaveBeenCalledWith({ autumnCustomerId: CREDS.autumnCustomerId, inviteeEmail: identity.email })
        })

        it('enrolls a platform with no billing account, and grants nothing when it still has none', async () => {
            const { mockPlatform } = await setupPlatform()
            const ensureEnrolled = vi.fn().mockResolvedValue(undefined)
            mockProvider({ ensureEnrolled })
            vi.mocked(autumnConsole.getCreds).mockResolvedValue(null)

            await joinAsNewMember({ platformId: mockPlatform.id })

            await vi.waitFor(() => expect(ensureEnrolled).toHaveBeenCalledWith(mockPlatform.id))
            expect(autumnConsole.grantInviteReward).not.toHaveBeenCalled()
        })

        it('grants once enrolling gives the platform a billing account', async () => {
            const { mockPlatform } = await setupPlatform()
            const identity = createMockUserIdentity({ verified: true })
            await databaseConnection().getRepository('user_identity').save(identity)
            vi.mocked(autumnConsole.getCreds).mockResolvedValueOnce(null).mockResolvedValueOnce(CREDS)

            await inviteRewardService(mockLog).grantOnJoin({ platformId: mockPlatform.id, identityId: identity.id })

            expect(autumnConsole.grantInviteReward).toHaveBeenCalledWith({ autumnCustomerId: CREDS.autumnCustomerId, inviteeEmail: identity.email })
        })

        it('fails the job for a retry when enrolling fails', async () => {
            const { mockPlatform } = await setupPlatform()
            const identity = createMockUserIdentity({ verified: true })
            await databaseConnection().getRepository('user_identity').save(identity)
            mockProvider({ ensureEnrolled: vi.fn().mockRejectedValue(new Error('console down')) })
            vi.mocked(autumnConsole.getCreds).mockResolvedValue(null)

            await expect(inviteRewardService(mockLog).grantOnJoin({ platformId: mockPlatform.id, identityId: identity.id })).rejects.toThrow('console down')
            expect(autumnConsole.grantInviteReward).not.toHaveBeenCalled()
        })

        it('still lets the person join when the console is down', async () => {
            const { mockPlatform } = await setupPlatform()
            vi.mocked(autumnConsole.grantInviteReward).mockRejectedValue(new Error('console down'))

            const email = await joinAsNewMember({ platformId: mockPlatform.id })

            const member = await databaseConnection().getRepository('user').findOneBy({ platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
            expect(member).not.toBeNull()
            expect(email).toContain('@')
        })

        it('keeps the reward request queued for a retry when the console fails', async () => {
            const { mockPlatform } = await setupPlatform()
            vi.mocked(autumnConsole.grantInviteReward).mockRejectedValue(new Error('console down'))

            const email = await joinAsNewMember({ platformId: mockPlatform.id })

            const identity = await databaseConnection().getRepository('user_identity').findOneByOrFail({ email })
            const jobId = `invite-reward-grant-${mockPlatform.id}-${identity.id}`
            await vi.waitFor(() => expect(autumnConsole.grantInviteReward).toHaveBeenCalledWith({ autumnCustomerId: CREDS.autumnCustomerId, inviteeEmail: email }))
            await vi.waitFor(async () => expect(await systemJobsSchedule(mockLog).getJobState(jobId)).toBe('delayed'))
        })
    })
})

async function setupPlatform() {
    const setup = await mockAndSaveBasicSetup({ plan: { plan: 'free', usersLimit: 5 } })
    const token = await generateMockToken({ id: setup.mockOwner.id, type: PrincipalType.USER, platform: { id: setup.mockPlatform.id } })
    return { ...setup, token }
}

function mockRefresh() {
    const refresh = vi.fn().mockResolvedValue(undefined)
    mockProvider({ refreshEntitlements: refresh })
    return refresh
}

function mockProvider(overrides: Partial<ReturnType<typeof billingProvider.get>>): void {
    const realProvider = billingProvider.get(mockLog)
    vi.spyOn(billingProvider, 'get').mockReturnValue({ ...realProvider, ensureEnrolled: vi.fn().mockResolvedValue(undefined), ...overrides })
}

async function provisionInvite({ email, platformId }: { email: string, platformId: string }): Promise<void> {
    await databaseConnection().getRepository('user_invitation').save({
        id: apId(),
        email,
        type: InvitationType.PLATFORM,
        platformId,
        platformRole: PlatformRole.MEMBER,
        status: InvitationStatus.ACCEPTED,
    })
    await userInvitationsService(mockLog).provisionUserInvitation({ email })
}

async function joinAsNewMember({ platformId }: { platformId: string }): Promise<string> {
    const identity = createMockUserIdentity({ verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    await provisionInvite({ email: identity.email, platformId })
    return identity.email
}

const CREDS = { autumnCustomerId: 'cus_test', autumnApiKey: 'key_test' }
