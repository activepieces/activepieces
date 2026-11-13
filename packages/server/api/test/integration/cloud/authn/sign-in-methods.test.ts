import { SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationUtils } from '../../../../src/app/authentication/authentication-utils'
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

describe('Sign-in methods of a platform', () => {
    it('reports SSO when SAML is set up on a verified domain, and email off when the platform turned it off', () => {
        const methods = authenticationUtils(mockLog).getSignInMethods({ platform: platformWith({ emailAuthEnabled: false, samlConfigured: true }) })
        expect(methods).toEqual({ email: false, google: false, sso: true })
    })

    it('does not report SSO when SAML is set up but the domain is still pending', () => {
        const methods = authenticationUtils(mockLog).getSignInMethods({ platform: platformWith({ samlConfigured: true, status: SsoDomainVerificationStatus.PENDING_VERIFICATION }) })
        expect(methods).toEqual({ email: true, google: false, sso: false })
    })

    it('does not report SSO when SAML is not set up', () => {
        const methods = authenticationUtils(mockLog).getSignInMethods({ platform: platformWith({ samlConfigured: false }) })
        expect(methods).toEqual({ email: true, google: false, sso: false })
    })

    it('reports Google only when the server has it set up', () => {
        process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
        process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
        const methods = authenticationUtils(mockLog).getSignInMethods({ platform: platformWith({ samlConfigured: false }) })
        expect(methods).toEqual({ email: true, google: true, sso: false })
    })

    it('does not report Google when the platform turned it off', () => {
        process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
        process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
        const methods = authenticationUtils(mockLog).getSignInMethods({ platform: platformWith({ samlConfigured: false, googleAuthEnabled: false }) })
        expect(methods).toEqual({ email: true, google: false, sso: false })
    })

    it('does not report Google when only the client id is set', () => {
        process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
        const methods = authenticationUtils(mockLog).getSignInMethods({ platform: platformWith({ samlConfigured: false }) })
        expect(methods).toEqual({ email: true, google: false, sso: false })
    })
})

function platformWith({ emailAuthEnabled = true, googleAuthEnabled = true, samlConfigured, status = SsoDomainVerificationStatus.VERIFIED }: PlatformWithParams): Parameters<ReturnType<typeof authenticationUtils>['getSignInMethods']>[0]['platform'] {
    return {
        emailAuthEnabled,
        googleAuthEnabled,
        federatedAuthProviders: {
            saml: samlConfigured ? { idpMetadata: '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"></md:EntityDescriptor>', idpCertificate: 'test-cert' } : null,
        },
        ssoDomainVerification: {
            status,
            record: { type: SsoDomainVerificationRecordType.TXT, name: '_activepieces-verify.acme.example.com', value: 'activepieces-verify=test' },
            createdAt: new Date().toISOString(),
        },
    }
}

type PlatformWithParams = {
    emailAuthEnabled?: boolean
    googleAuthEnabled?: boolean
    samlConfigured: boolean
    status?: SsoDomainVerificationStatus
}
