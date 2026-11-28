import { Platform, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { emailDomainRepo } from '../../../../src/app/ee/authentication/email-domain/email-domain.service'
import { platformRepo } from '../../../../src/app/platform/platform.service'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterEach(() => {
    delete process.env.AP_GOOGLE_CLIENT_ID
    delete process.env.AP_GOOGLE_CLIENT_SECRET
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Last sign-in method guard on Cloud', () => {
    it.each([
        {
            reason: 'turning email off when it is the only method',
            platform: { emailAuthEnabled: true, googleAuthEnabled: false },
            googleKeys: false,
            body: { emailAuthEnabled: false },
        },
        {
            reason: 'turning email off when Google is on but the server has no Google keys',
            platform: { emailAuthEnabled: true, googleAuthEnabled: true },
            googleKeys: false,
            body: { emailAuthEnabled: false },
        },
        {
            reason: 'turning Google off when it is the only method',
            platform: { emailAuthEnabled: false, googleAuthEnabled: true },
            googleKeys: true,
            body: { googleAuthEnabled: false },
        },
        {
            reason: 'disabling SSO when it is the only method',
            platform: { emailAuthEnabled: false, googleAuthEnabled: false },
            ssoDomain: 'disable-sso.example.com',
            googleKeys: false,
            body: { federatedAuthProviders: { saml: null } },
        },
    ])('refuses $reason', async ({ platform, ssoDomain, googleKeys, body }) => {
        setGoogleKeys({ configured: googleKeys })
        const ctx = await createTestContext(app, { platform: { ...platform, ...ssoOn({ domain: ssoDomain }) }, plan: { ssoEnabled: true } })
        const before = await readSignInSettings({ platformId: ctx.platform.id })

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, body)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION', params: { message: LAST_METHOD_MESSAGE } }))
        expect(await readSignInSettings({ platformId: ctx.platform.id })).toEqual(before)
    })

    it('refuses removing the domain when SSO is the only method', async () => {
        setGoogleKeys({ configured: false })
        const ctx = await createTestContext(app, {
            platform: { emailAuthEnabled: false, googleAuthEnabled: false, ...ssoOn({ domain: 'remove-domain.example.com' }) },
            plan: { ssoEnabled: true },
        })
        const before = await readSignInSettings({ platformId: ctx.platform.id })
        const emailDomain = await emailDomainRepo().findOneByOrFail({ platformId: ctx.platform.id })

        const response = await ctx.delete(`/v1/email-domains/${emailDomain.id}`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION', params: { message: LAST_METHOD_MESSAGE } }))
        expect(await readSignInSettings({ platformId: ctx.platform.id })).toEqual(before)
    })

    it.each([
        {
            reason: 'turning email off while Google still works',
            platform: { emailAuthEnabled: true, googleAuthEnabled: true },
            googleKeys: true,
            body: { emailAuthEnabled: false },
        },
        {
            reason: 'renaming a platform that already has no working method',
            platform: { emailAuthEnabled: false, googleAuthEnabled: false },
            googleKeys: false,
            body: { name: 'Renamed platform' },
        },
    ])('allows $reason', async ({ platform, googleKeys, body }) => {
        setGoogleKeys({ configured: googleKeys })
        const ctx = await createTestContext(app, { platform, plan: { ssoEnabled: true } })

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, body)

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

})

function setGoogleKeys({ configured }: { configured: boolean }): void {
    if (configured) {
        process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
        process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    }
}

function ssoOn({ domain }: { domain: string | undefined }): SsoOnSettings | Record<string, never> {
    if (domain === undefined) {
        return {}
    }
    return {
        ssoDomain: domain,
        ssoDomainVerification: {
            status: SsoDomainVerificationStatus.VERIFIED,
            record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domain}`, value: 'activepieces-verify=test-token' },
            createdAt: new Date().toISOString(),
        },
        federatedAuthProviders: { saml: SAML },
    }
}

async function readSignInSettings({ platformId }: { platformId: string }): Promise<SignInSettings> {
    return platformRepo().findOneOrFail({
        where: { id: platformId },
        select: { id: true, emailAuthEnabled: true, googleAuthEnabled: true, ssoDomain: true, ssoDomainVerification: true, federatedAuthProviders: true },
    })
}

const LAST_METHOD_MESSAGE = 'This is the only way left to sign in. Turn on another sign-in method first.'

const SAML = { idpMetadata: '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"></md:EntityDescriptor>', idpCertificate: 'test-cert' }

type SsoOnSettings = {
    ssoDomain: string
    ssoDomainVerification: SsoDomainVerification
    federatedAuthProviders: { saml: typeof SAML }
}

type SignInSettings = Pick<Platform, 'id' | 'emailAuthEnabled' | 'googleAuthEnabled' | 'ssoDomain' | 'ssoDomainVerification' | 'federatedAuthProviders'>
