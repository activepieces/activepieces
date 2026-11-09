import { apId } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, InviteRewardSummary, PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { autumnConsole } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { systemJobsSchedule } from '../../../../src/app/helper/system-jobs/system-job'
import { billingProvider } from '../../../../src/app/platform/billing-provider'
import { userInvitationsService } from '../../../../src/app/user-invitations/user-invitation.service'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUserIdentity, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
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
    vi.spyOn(autumnConsole, 'listInviteRewards').mockResolvedValue(consoleRewards({ rewards: [] }))
})

describe('Invite reward', () => {
    describe('when an invited person joins', () => {
        it('asks the console to grant a reward for the new member', async () => {
            const { mockPlatform } = await setupPlatform()

            const email = await joinAsNewMember({ platformId: mockPlatform.id })

            await vi.waitFor(() => expect(autumnConsole.grantInviteReward).toHaveBeenCalledTimes(1))
            expect(autumnConsole.grantInviteReward).toHaveBeenCalledWith({ autumnCustomerId: CREDS.autumnCustomerId, inviteeEmail: email })
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
            vi.mocked(autumnConsole.grantInviteReward).mockResolvedValue({ granted: false, reason: 'cap_reached' })

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

        it('does nothing when the platform has no billing account', async () => {
            const { mockPlatform } = await setupPlatform()
            vi.mocked(autumnConsole.getCreds).mockResolvedValue(null)

            await joinAsNewMember({ platformId: mockPlatform.id })

            await new Promise((resolve) => setTimeout(resolve, 200))
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

            const jobId = `invite-reward-grant-${mockPlatform.id}-${email}`
            await vi.waitFor(() => expect(autumnConsole.grantInviteReward).toHaveBeenCalledWith({ autumnCustomerId: CREDS.autumnCustomerId, inviteeEmail: email }))
            await vi.waitFor(async () => expect(await systemJobsSchedule(mockLog).getJobState(jobId)).toBe('delayed'))
        })
    })

    describe('GET /v1/invite-rewards', () => {
        it('returns the console summary', async () => {
            const { token } = await setupPlatform()
            vi.mocked(autumnConsole.listInviteRewards).mockResolvedValue(consoleRewards({
                rewards: [{ id: 'r1', email: 'a@example.com', credits: 1000, created: '2026-11-08T00:00:00.000Z' }],
            }))

            const response = await getSummary({ token })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()).toEqual({
                eligible: true,
                creditsPerInvite: 1000,
                maxRewards: 4,
                rewards: [{ id: 'r1', email: 'a@example.com', credits: 1000, created: '2026-11-08T00:00:00.000Z' }],
            })
        })

        it('reports not eligible when the platform has no billing account', async () => {
            const { token } = await setupPlatform()
            vi.mocked(autumnConsole.getCreds).mockResolvedValue(null)

            const response = await getSummary({ token })

            expect(response?.json()).toEqual({ eligible: false, creditsPerInvite: 0, maxRewards: 0, rewards: [] })
            expect(autumnConsole.listInviteRewards).not.toHaveBeenCalled()
        })

        it('rejects a platform member who is not an admin', async () => {
            const { mockPlatform } = await setupPlatform()
            const { mockUser } = await mockBasicUser({ user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER } })
            const token = await generateMockToken({ id: mockUser.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

            const response = await getSummary({ token })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
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
    const realProvider = billingProvider.get(mockLog)
    vi.spyOn(billingProvider, 'get').mockReturnValue({ ...realProvider, refreshEntitlements: refresh })
    return refresh
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

async function getSummary({ token }: { token: string }) {
    return app?.inject({ method: 'GET', url: '/api/v1/invite-rewards', headers: { authorization: `Bearer ${token}` } })
}

function consoleRewards({ rewards }: { rewards: InviteRewardSummary['rewards'] }): InviteRewardSummary {
    return { eligible: true, creditsPerInvite: 1000, maxRewards: 4, rewards }
}

const CREDS = { autumnCustomerId: 'cus_test', autumnApiKey: 'key_test' }
