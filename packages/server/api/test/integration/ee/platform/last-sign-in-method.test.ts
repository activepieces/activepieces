import { SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Last sign-in method guard on self-hosted EE', () => {
    it.each([
        {
            reason: 'disabling SSO when it is the only method, even with the domain still pending',
            domain: 'ee-disable-sso.example.com',
            status: SsoDomainVerificationStatus.PENDING_VERIFICATION,
            path: 'platform',
            body: { federatedAuthProviders: { saml: null } },
        },
        {
            reason: 'removing a verified domain when SSO is the only method, because it also deletes SAML',
            domain: 'ee-remove-domain.example.com',
            status: SsoDomainVerificationStatus.VERIFIED,
            path: 'sso-domain',
            body: { ssoDomain: null },
        },
    ])('refuses $reason', async ({ domain, status, path, body }) => {
        const ctx = await createTestContext(app, { platform: onlySso({ domain, status }), plan: { ssoEnabled: true } })

        const response = await ctx.post(path === 'platform' ? `/v1/platforms/${ctx.platform.id}` : SSO_DOMAIN, body)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION', params: { message: LAST_METHOD_MESSAGE } }))
    })

    it('allows changing the domain when SSO is the only method, because EE does not check the domain at sign-in', async () => {
        const ctx = await createTestContext(app, {
            platform: onlySso({ domain: 'ee-change-domain.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            plan: { ssoEnabled: true },
        })

        const response = await ctx.post(SSO_DOMAIN, { ssoDomain: 'ee-changed-domain.example.com' })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })
})

function onlySso({ domain, status }: { domain: string, status: SsoDomainVerificationStatus }): OnlySsoPlatform {
    return {
        emailAuthEnabled: false,
        googleAuthEnabled: false,
        ssoDomain: domain,
        ssoDomainVerification: {
            status,
            record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domain}`, value: 'activepieces-verify=test-token' },
            createdAt: new Date().toISOString(),
        },
        federatedAuthProviders: { saml: SAML },
    }
}

const SSO_DOMAIN = '/v1/authn/saml/sso-domain'

const LAST_METHOD_MESSAGE = 'This is the only way left to sign in. Turn on another sign-in method first.'

const SAML = { idpMetadata: '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"></md:EntityDescriptor>', idpCertificate: 'test-cert' }

type OnlySsoPlatform = {
    emailAuthEnabled: boolean
    googleAuthEnabled: boolean
    ssoDomain: string
    ssoDomainVerification: SsoDomainVerification
    federatedAuthProviders: { saml: typeof SAML }
}
