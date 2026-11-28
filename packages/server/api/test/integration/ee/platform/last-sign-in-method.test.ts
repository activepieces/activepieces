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

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Last sign-in method guard on self-hosted EE', () => {
    it('refuses disabling SSO when it is the only method, even with the domain still pending', async () => {
        const ctx = await createTestContext(app, {
            platform: onlySso({ domain: 'ee-disable-sso.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION }),
            plan: { ssoEnabled: true },
        })
        const before = await readSignInSettings({ platformId: ctx.platform.id })

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { federatedAuthProviders: { saml: null } })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION', params: { message: LAST_METHOD_MESSAGE } }))
        expect(await readSignInSettings({ platformId: ctx.platform.id })).toEqual(before)
    })

    it('refuses removing a verified domain when SSO is the only method, because it also deletes SAML', async () => {
        const ctx = await createTestContext(app, {
            platform: onlySso({ domain: 'ee-remove-domain.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            plan: { ssoEnabled: true },
        })
        const before = await readSignInSettings({ platformId: ctx.platform.id })
        const emailDomain = await emailDomainRepo().findOneByOrFail({ platformId: ctx.platform.id })

        const response = await ctx.delete(`/v1/email-domains/${emailDomain.id}`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION', params: { message: LAST_METHOD_MESSAGE } }))
        expect(await readSignInSettings({ platformId: ctx.platform.id })).toEqual(before)
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

async function readSignInSettings({ platformId }: { platformId: string }): Promise<SignInSettings> {
    return platformRepo().findOneOrFail({
        where: { id: platformId },
        select: { id: true, emailAuthEnabled: true, googleAuthEnabled: true, ssoDomain: true, ssoDomainVerification: true, federatedAuthProviders: true },
    })
}

const LAST_METHOD_MESSAGE = 'This is the only way left to sign in. Turn on another sign-in method first.'

const SAML = { idpMetadata: '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"></md:EntityDescriptor>', idpCertificate: 'test-cert' }

type OnlySsoPlatform = {
    emailAuthEnabled: boolean
    googleAuthEnabled: boolean
    ssoDomain: string
    ssoDomainVerification: SsoDomainVerification
    federatedAuthProviders: { saml: typeof SAML }
}

type SignInSettings = Pick<Platform, 'id' | 'emailAuthEnabled' | 'googleAuthEnabled' | 'ssoDomain' | 'ssoDomainVerification' | 'federatedAuthProviders'>
