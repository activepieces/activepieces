import { SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { createMockSignInRequest } from '../../../helpers/mocks/authn'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const PASSWORD = 'correct-horse-battery'
const DOMAIN = 'acme.example.com'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Sign-in method enforcement on EE', () => {
    it('keeps main\'s email-off refusal on the platform, verified domain or not', async () => {
        const { mockUserIdentity } = await mockAndSaveBasicSetup({
            userIdentity: { email: `maya@${DOMAIN}`, password: PASSWORD },
            platform: {
                emailAuthEnabled: false,
                ssoDomain: DOMAIN,
                ssoDomainVerification: {
                    status: SsoDomainVerificationStatus.VERIFIED,
                    record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${DOMAIN}`, value: 'activepieces-verify=test' },
                    createdAt: new Date().toISOString(),
                },
            },
            plan: { ssoEnabled: true },
        })

        const response = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-in',
            body: createMockSignInRequest({ email: mockUserIdentity.email, password: PASSWORD }),
        })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(response?.json()?.code).toBe('EMAIL_AUTH_DISABLED')
    })
})
