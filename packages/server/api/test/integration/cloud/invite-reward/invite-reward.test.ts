import { apId } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, PlatformRole } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { inviteRewardService } from '../../../../src/app/ee/invite-reward/invite-reward.service'
import { autumnConsole } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { billingProvider } from '../../../../src/app/platform/billing-provider'
import { userInvitationsService } from '../../../../src/app/user-invitations/user-invitation.service'
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
    vi.spyOn(autumnConsole, 'grantInviteReward').mockResolvedValue({ granted: true, credits: 1000 })
})

describe('Invite reward', () => {
    describe('when an invited person joins', () => {
        it('sends the customer id and the invitee email to the console', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({ plan: { plan: 'free', usersLimit: 5 } })

            const email = await joinAsNewMember({ platformId: mockPlatform.id })

            await vi.waitFor(() => expect(autumnConsole.grantInviteReward).toHaveBeenCalledExactlyOnceWith({ autumnCustomerId: CREDS.autumnCustomerId, inviteeEmail: email }))
        })

        it('refreshes the balance after the console grants', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({ plan: { plan: 'free', usersLimit: 5 } })
            const refresh = mockRefresh()

            await joinAsNewMember({ platformId: mockPlatform.id })

            await vi.waitFor(() => expect(refresh).toHaveBeenCalledWith(mockPlatform.id))
        })

        it('does not refresh the balance when the console grants nothing', async () => {
            const refresh = mockRefresh()
            vi.mocked(autumnConsole.grantInviteReward).mockResolvedValue({ granted: false })

            await inviteRewardService(mockLog).grantOnJoin({ platformId: apId(), invitationId: apId(), inviteeEmail: 'invitee@example.com' })

            expect(refresh).not.toHaveBeenCalled()
        })

        it('does not ask for a reward when someone already on the platform accepts again', async () => {
            const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup({ plan: { plan: 'free', usersLimit: 5 } })
            const owner = await databaseConnection().getRepository('user_identity').findOneByOrFail({ id: mockOwner.identityId })

            await provisionInvite({ email: owner.email, platformId: mockPlatform.id })

            await new Promise((resolve) => setTimeout(resolve, 200))
            expect(autumnConsole.grantInviteReward).not.toHaveBeenCalled()
        })

        it('asks for nothing when the platform has no billing account', async () => {
            vi.mocked(autumnConsole.getCreds).mockResolvedValue(null)

            await inviteRewardService(mockLog).grantOnJoin({ platformId: apId(), invitationId: apId(), inviteeEmail: 'invitee@example.com' })

            expect(autumnConsole.grantInviteReward).not.toHaveBeenCalled()
        })

        it('logs the customer and invitation ids when the console fails, without throwing', async () => {
            vi.mocked(autumnConsole.grantInviteReward).mockRejectedValue(new Error('console down'))
            const errorLog = vi.spyOn(mockLog, 'error')
            const invitationId = apId()

            await inviteRewardService(mockLog).grantOnJoin({ platformId: apId(), invitationId, inviteeEmail: 'invitee@example.com' })

            expect(errorLog).toHaveBeenCalledWith(expect.objectContaining({ autumnCustomerId: CREDS.autumnCustomerId, invitationId }), expect.any(String))
        })

        it('still lets the person join when the console is down', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({ plan: { plan: 'free', usersLimit: 5 } })
            vi.mocked(autumnConsole.grantInviteReward).mockRejectedValue(new Error('console down'))

            await joinAsNewMember({ platformId: mockPlatform.id })

            const member = await databaseConnection().getRepository('user').findOneBy({ platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
            expect(member).not.toBeNull()
        })
    })
})

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

const CREDS = { autumnCustomerId: 'cus_test', autumnApiKey: 'key_test' }
