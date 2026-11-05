import { InvitationStatus, InvitationType, PlatformRole, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../../src/app/authentication/authentication.service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockUserIdentity, createMockUserInvitation, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let mockLog: FastifyBaseLogger

beforeAll(async () => {
    const app = await setupTestEnvironment()
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Governing platform', () => {
    it('is the platform that verified the domain when the person is a member of it, ignoring case', async () => {
        const { mockPlatform } = await saveDomainOwnerPlatform({ domain: 'member.example.com', ownerEmail: 'owner@member.example.com' })
        const governing = await authenticationService(mockLog).findGoverningPlatform({ email: ' OWNER@Member.example.com ' })
        expect(governing?.id).toBe(mockPlatform.id)
    })

    it('is the platform that verified the domain when the person holds an accepted invitation and has no account yet', async () => {
        const { mockPlatform } = await saveDomainOwnerPlatform({ domain: 'invited.example.com', ownerEmail: 'owner@invited.example.com' })
        await saveInvitation({ email: 'sam@invited.example.com', platformId: mockPlatform.id, status: InvitationStatus.ACCEPTED })
        const governing = await authenticationService(mockLog).findGoverningPlatform({ email: 'sam@invited.example.com' })
        expect(governing?.id).toBe(mockPlatform.id)
    })

    it('is nothing when the only tie is a pending invitation', async () => {
        const { mockPlatform } = await saveDomainOwnerPlatform({ domain: 'pending-invite.example.com', ownerEmail: 'owner@pending-invite.example.com' })
        await saveInvitation({ email: 'sam@pending-invite.example.com', platformId: mockPlatform.id, status: InvitationStatus.PENDING })
        await expect(authenticationService(mockLog).findGoverningPlatform({ email: 'sam@pending-invite.example.com' })).resolves.toBeNull()
    })

    it('is nothing when the domain is owned but the person has no tie to the platform, with or without an account', async () => {
        await saveDomainOwnerPlatform({ domain: 'no-tie.example.com', ownerEmail: 'owner@no-tie.example.com' })
        const stranger = createMockUserIdentity({ email: 'stranger@no-tie.example.com', verified: true })
        await databaseConnection().getRepository('user_identity').save(stranger)
        await expect(authenticationService(mockLog).findGoverningPlatform({ email: stranger.email })).resolves.toBeNull()
        await expect(authenticationService(mockLog).findGoverningPlatform({ email: 'nobody@no-tie.example.com' })).resolves.toBeNull()
    })

    it('is nothing for a member whose email is on a domain the platform did not verify', async () => {
        const { mockUserIdentity } = await saveDomainOwnerPlatform({ domain: 'guests.example.com', ownerEmail: 'owner@agency.example.com' })
        await expect(authenticationService(mockLog).findGoverningPlatform({ email: mockUserIdentity.email })).resolves.toBeNull()
    })

    it.each([
        { reason: 'the email has no domain', domain: 'blank.example.com', lookup: 'owner-blank.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true },
        { reason: 'the domain is still pending verification', domain: 'pending.example.com', lookup: 'owner@pending.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION, ssoEnabled: true },
        { reason: 'the plan has no SSO', domain: 'no-sso.example.com', lookup: 'owner@no-sso.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: false },
        { reason: 'the email is on a subdomain of the verified domain', domain: 'parent.example.com', lookup: 'owner@eu.parent.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true },
        { reason: 'no platform owns the domain', domain: 'claimed.example.com', lookup: 'owner@unclaimed.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true },
    ])('is nothing for a member when $reason', async ({ domain, lookup, status, ssoEnabled }) => {
        await saveDomainOwnerPlatform({ domain, ownerEmail: lookup, status, ssoEnabled })
        await expect(authenticationService(mockLog).findGoverningPlatform({ email: lookup })).resolves.toBeNull()
    })
})

function saveDomainOwnerPlatform({ domain, ownerEmail, status = SsoDomainVerificationStatus.VERIFIED, ssoEnabled = true }: SaveDomainOwnerPlatformParams): ReturnType<typeof mockAndSaveBasicSetup> {
    return mockAndSaveBasicSetup({
        userIdentity: { email: ownerEmail },
        platform: {
            ssoDomain: domain,
            ssoDomainVerification: {
                status,
                record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domain}`, value: 'activepieces-verify=test' },
                createdAt: new Date().toISOString(),
            },
        },
        plan: { ssoEnabled },
    })
}

async function saveInvitation({ email, platformId, status }: SaveInvitationParams): Promise<void> {
    const invitation = createMockUserInvitation({ email, platformId, status, type: InvitationType.PLATFORM, platformRole: PlatformRole.MEMBER })
    await databaseConnection().getRepository('user_invitation').save(invitation)
}

type SaveDomainOwnerPlatformParams = {
    domain: string
    ownerEmail: string
    status?: SsoDomainVerificationStatus
    ssoEnabled?: boolean
}

type SaveInvitationParams = {
    email: string
    platformId: string
    status: InvitationStatus
}
