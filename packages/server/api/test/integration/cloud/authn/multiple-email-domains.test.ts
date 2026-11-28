import { apId } from '@activepieces/core-utils'
import { SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { authenticationUtils } from '../../../../src/app/authentication/authentication-utils'
import { turnstile } from '../../../../src/app/authentication/lib/turnstile'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { createMockSignInRequest } from '../../../helpers/mocks/authn'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

process.env.AP_TURNSTILE_SITE_KEY = 'test-site-key'
process.env.AP_TURNSTILE_SECRET_KEY = 'test-secret-key'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    vi.spyOn(turnstile, 'assertSolved').mockResolvedValue(undefined)
    app = await setupTestEnvironment()
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Sign-in rules on every verified domain of a platform', () => {
    it('refuses password sign-in for a member on the second verified domain when the platform turned email off', async () => {
        const { email } = await savePlatformWithTwoDomains({ memberDomainStatus: SsoDomainVerificationStatus.VERIFIED, emailAuthEnabled: false })

        const response = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-in',
            body: createMockSignInRequest({ email, password: PASSWORD }),
        })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(response?.json()?.code).toBe('SIGN_IN_METHOD_NOT_ALLOWED')
    })

    it('accepts SAML sign-in from the second verified domain', async () => {
        const { email, platformId } = await savePlatformWithTwoDomains({ memberDomainStatus: SsoDomainVerificationStatus.VERIFIED, emailAuthEnabled: true })

        await expect(authenticationUtils(mockLog).assertEmailMatchesSsoDomain({ email, platformId })).resolves.toBeUndefined()
    })

    it('refuses SAML sign-in from a domain that is still pending', async () => {
        const { email, platformId } = await savePlatformWithTwoDomains({ memberDomainStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION, emailAuthEnabled: true })

        await expect(authenticationUtils(mockLog).assertEmailMatchesSsoDomain({ email, platformId })).rejects.toMatchObject({ error: { code: 'DOMAIN_NOT_ALLOWED' } })
    })
})

async function savePlatformWithTwoDomains({ memberDomainStatus, emailAuthEnabled }: SavePlatformWithTwoDomainsParams): Promise<{ email: string, platformId: string }> {
    const firstDomain = uniqueDomain()
    const memberDomain = uniqueDomain()
    const email = `maya@${memberDomain}`
    const { mockPlatform } = await mockAndSaveBasicSetup({
        userIdentity: { email, password: PASSWORD },
        platform: {
            emailAuthEnabled,
            googleAuthEnabled: true,
            ssoDomain: firstDomain,
            ssoDomainVerification: {
                status: SsoDomainVerificationStatus.VERIFIED,
                record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${firstDomain}`, value: TXT_VALUE },
                createdAt: new Date().toISOString(),
            },
        },
        plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
    })
    await databaseConnection().getRepository('email_domain').save({
        id: apId(),
        platformId: mockPlatform.id,
        domain: memberDomain,
        verificationStatus: memberDomainStatus,
        verificationRecordValue: TXT_VALUE,
    })
    return { email, platformId: mockPlatform.id }
}

function uniqueDomain(): string {
    return `${apId().toLowerCase()}.example.com`
}

const PASSWORD = 'correct-horse-battery'
const TXT_VALUE = 'activepieces-verify=test'

type SavePlatformWithTwoDomainsParams = {
    memberDomainStatus: SsoDomainVerificationStatus
    emailAuthEnabled: boolean
}
