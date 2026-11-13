import { resolveTxt } from 'dns/promises'
import { EmailDomain, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

vi.mock('dns/promises', () => ({
    resolveTxt: vi.fn(),
}))

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('POST /v1/authn/saml/sso-domain/verify', () => {
    it('marks the domain row verified when the TXT record matches', async () => {
        vi.mocked(resolveTxt).mockResolvedValue([[TXT_VALUE]])
        const ctx = await createPlatformWithPendingDomain('verify-match.example.com')

        await ctx.post(VERIFY, {})

        expect(await findEmailDomains(ctx.platform.id)).toEqual([expect.objectContaining({
            domain: 'verify-match.example.com',
            verificationStatus: SsoDomainVerificationStatus.VERIFIED,
        })])
    })

    it('leaves the domain row pending when the TXT record differs', async () => {
        vi.mocked(resolveTxt).mockResolvedValue([['activepieces-verify=someone-else']])
        const ctx = await createPlatformWithPendingDomain('verify-mismatch.example.com')

        await ctx.post(VERIFY, {})

        expect(await findEmailDomains(ctx.platform.id)).toEqual([expect.objectContaining({
            domain: 'verify-mismatch.example.com',
            verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION,
        })])
    })
})

async function createPlatformWithPendingDomain(domain: string): Promise<TestContext> {
    return createTestContext(app, {
        plan: { ssoEnabled: true },
        platform: {
            ssoDomain: domain,
            ssoDomainVerification: {
                status: SsoDomainVerificationStatus.PENDING_VERIFICATION,
                record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domain}`, value: TXT_VALUE },
                createdAt: new Date().toISOString(),
            },
        },
    })
}

async function findEmailDomains(platformId: string): Promise<EmailDomain[]> {
    return databaseConnection().getRepository<EmailDomain>('email_domain').findBy({ platformId })
}

const VERIFY = '/v1/authn/saml/sso-domain/verify'
const TXT_VALUE = 'activepieces-verify=test-token'
