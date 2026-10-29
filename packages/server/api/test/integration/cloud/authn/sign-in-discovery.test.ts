import { SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../../src/app/authentication/authentication.service'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let mockLog: FastifyBaseLogger

beforeAll(async () => {
    const app = await setupTestEnvironment()
    mockLog = app.log
})

afterEach(() => {
    delete process.env.AP_GOOGLE_CLIENT_ID
    delete process.env.AP_GOOGLE_CLIENT_SECRET
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Sign-in discovery', () => {
    it('returns the methods of the platform that owns the domain, ignoring case', async () => {
        await saveDomainOwnerPlatform({ domain: 'acme.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true, emailAuthEnabled: false, samlConfigured: true })
        await expect(authenticationService(mockLog).discoverSignInMethods({ domain: ' ACME.example.com ' })).resolves.toEqual({
            domainOwned: true,
            methods: { email: false, google: false, sso: true },
        })
    })

    it('returns the methods of a platform that owns the domain without setting up SSO', async () => {
        await saveDomainOwnerPlatform({ domain: 'no-saml.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true, emailAuthEnabled: true, samlConfigured: false })
        await expect(authenticationService(mockLog).discoverSignInMethods({ domain: 'no-saml.example.com' })).resolves.toEqual({
            domainOwned: true,
            methods: { email: true, google: false, sso: false },
        })
    })

    it('reports Google only when the server has it set up', async () => {
        await saveDomainOwnerPlatform({ domain: 'google.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true, emailAuthEnabled: true, samlConfigured: false })
        process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
        process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
        await expect(authenticationService(mockLog).discoverSignInMethods({ domain: 'google.example.com' })).resolves.toEqual({
            domainOwned: true,
            methods: { email: true, google: true, sso: false },
        })
    })

    it('does not report Google when the platform turned it off', async () => {
        await saveDomainOwnerPlatform({ domain: 'google-off.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true, emailAuthEnabled: true, samlConfigured: false, googleAuthEnabled: false })
        process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
        process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
        await expect(authenticationService(mockLog).discoverSignInMethods({ domain: 'google-off.example.com' })).resolves.toEqual({
            domainOwned: true,
            methods: { email: true, google: false, sso: false },
        })
    })

    it('does not report Google when only the client id is set', async () => {
        await saveDomainOwnerPlatform({ domain: 'google-no-secret.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true, emailAuthEnabled: true, samlConfigured: false })
        process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
        await expect(authenticationService(mockLog).discoverSignInMethods({ domain: 'google-no-secret.example.com' })).resolves.toEqual({
            domainOwned: true,
            methods: { email: true, google: false, sso: false },
        })
    })

    it.each([
        { reason: 'the domain is blank', domain: 'blank.example.com', lookup: '   ', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true },
        { reason: 'the domain is pending', domain: 'pending.example.com', lookup: 'pending.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION, ssoEnabled: true },
        { reason: 'the plan has no SSO', domain: 'no-sso.example.com', lookup: 'no-sso.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: false },
        { reason: 'the domain is a subdomain', domain: 'parent.example.com', lookup: 'eu.parent.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true },
        { reason: 'no platform owns the domain', domain: 'claimed.example.com', lookup: 'unclaimed.example.com', status: SsoDomainVerificationStatus.VERIFIED, ssoEnabled: true },
    ])('returns only domainOwned: false when $reason', async ({ domain, lookup, status, ssoEnabled }) => {
        await saveDomainOwnerPlatform({ domain, status, ssoEnabled, emailAuthEnabled: true, samlConfigured: true })
        await expect(authenticationService(mockLog).discoverSignInMethods({ domain: lookup })).resolves.toEqual({ domainOwned: false })
    })
})

async function saveDomainOwnerPlatform({ domain, status, ssoEnabled, emailAuthEnabled, samlConfigured, googleAuthEnabled = true }: SaveDomainOwnerPlatformParams): Promise<void> {
    await mockAndSaveBasicSetup({
        platform: {
            ssoDomain: domain,
            ssoDomainVerification: {
                status,
                record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domain}`, value: 'activepieces-verify=test' },
                createdAt: new Date().toISOString(),
            },
            emailAuthEnabled,
            googleAuthEnabled,
            federatedAuthProviders: {
                saml: samlConfigured ? { idpMetadata: '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"></md:EntityDescriptor>', idpCertificate: 'test-cert' } : null,
            },
        },
        plan: { ssoEnabled },
    })
}

type SaveDomainOwnerPlatformParams = {
    domain: string
    status: SsoDomainVerificationStatus
    ssoEnabled: boolean
    emailAuthEnabled: boolean
    samlConfigured: boolean
    googleAuthEnabled?: boolean
}
