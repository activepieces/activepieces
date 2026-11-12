import { apId } from '@activepieces/core-utils'
import { SsoDomainVerificationStatus, SsoProviderProtocol, SsoProviderStatus } from '@activepieces/shared'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockPlatform, createMockUser, createMockUserIdentity } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

beforeAll(async () => {
    await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('email_domain table', () => {
    it('refuses a domain that another platform already verified', async () => {
        const firstPlatformId = await savePlatform()
        const secondPlatformId = await savePlatform()
        await saveEmailDomain({ platformId: firstPlatformId, domain: 'acme.com', verificationStatus: SsoDomainVerificationStatus.VERIFIED })

        await expect(saveEmailDomain({ platformId: secondPlatformId, domain: 'acme.com', verificationStatus: SsoDomainVerificationStatus.VERIFIED })).rejects.toMatchObject({ driverError: { constraint: 'idx_email_domain_verified_domain' } })
    })

    it('lets two platforms both claim a domain while it is pending', async () => {
        const firstPlatformId = await savePlatform()
        const secondPlatformId = await savePlatform()
        await saveEmailDomain({ platformId: firstPlatformId, domain: 'pending.com', verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION })

        await expect(saveEmailDomain({ platformId: secondPlatformId, domain: 'pending.com', verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION })).resolves.toBeDefined()
    })

    it('refuses the same domain twice on one platform', async () => {
        const platformId = await savePlatform()
        await saveEmailDomain({ platformId, domain: 'twice.com', verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION })

        await expect(saveEmailDomain({ platformId, domain: 'twice.com', verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION })).rejects.toMatchObject({ driverError: { constraint: 'idx_email_domain_platform_id_domain' } })
    })
})

describe('sso_provider table', () => {
    it('refuses a second provider in use on one platform', async () => {
        const platformId = await savePlatform()
        await saveSsoProvider({ platformId, status: SsoProviderStatus.ENABLED })

        await expect(saveSsoProvider({ platformId, status: SsoProviderStatus.DISABLED })).rejects.toMatchObject({ driverError: { constraint: 'idx_sso_provider_platform_id_not_draft' } })
    })

    it('keeps one draft beside the provider in use', async () => {
        const platformId = await savePlatform()
        await saveSsoProvider({ platformId, status: SsoProviderStatus.ENABLED })

        await expect(saveSsoProvider({ platformId, status: SsoProviderStatus.DRAFT })).resolves.toBeDefined()
    })

    it('refuses a second draft on one platform', async () => {
        const platformId = await savePlatform()
        await saveSsoProvider({ platformId, status: SsoProviderStatus.DRAFT })

        await expect(saveSsoProvider({ platformId, status: SsoProviderStatus.DRAFT })).rejects.toMatchObject({ driverError: { constraint: 'idx_sso_provider_platform_id_draft' } })
    })

    it('leaves the provider config out of a plain read', async () => {
        const platformId = await savePlatform()
        const id = await saveSsoProvider({ platformId, status: SsoProviderStatus.ENABLED })

        const provider = await databaseConnection().getRepository('sso_provider').findOneByOrFail({ id })

        expect(provider.config).toBeUndefined()
    })
})

describe('deleting a platform', () => {
    it('deletes its email domains and SSO providers', async () => {
        const platformId = await savePlatform()
        await saveEmailDomain({ platformId, domain: 'gone.com', verificationStatus: SsoDomainVerificationStatus.VERIFIED })
        await saveSsoProvider({ platformId, status: SsoProviderStatus.ENABLED })

        await databaseConnection().getRepository('platform').delete({ id: platformId })

        expect(await databaseConnection().getRepository('email_domain').countBy({ platformId })).toBe(0)
        expect(await databaseConnection().getRepository('sso_provider').countBy({ platformId })).toBe(0)
    })
})

async function savePlatform(): Promise<string> {
    const identity = createMockUserIdentity({ verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    const owner = createMockUser({ identityId: identity.id })
    await databaseConnection().getRepository('user').save(owner)
    const platform = createMockPlatform({ ownerId: owner.id })
    await databaseConnection().getRepository('platform').save(platform)
    return platform.id
}

async function saveEmailDomain({ platformId, domain, verificationStatus }: SaveEmailDomainParams): Promise<string> {
    const id = apId()
    await databaseConnection().getRepository('email_domain').insert({
        id,
        platformId,
        domain,
        verificationStatus,
        verificationRecordValue: `activepieces-verify=${apId()}`,
    })
    return id
}

async function saveSsoProvider({ platformId, status }: SaveSsoProviderParams): Promise<string> {
    const id = apId()
    await databaseConnection().getRepository('sso_provider').insert({
        id,
        platformId,
        protocol: SsoProviderProtocol.SAML,
        status,
        config: { idpMetadata: '<md:EntityDescriptor />', idpCertificate: 'certificate', spEntityId: 'Activepieces' },
    })
    return id
}

type SaveEmailDomainParams = {
    platformId: string
    domain: string
    verificationStatus: SsoDomainVerificationStatus
}

type SaveSsoProviderParams = {
    platformId: string
    status: SsoProviderStatus
}
