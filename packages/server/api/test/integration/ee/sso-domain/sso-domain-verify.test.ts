import { resolveTxt } from 'dns/promises'
import { EmailDomain, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { authnSsoSamlService } from '../../../../src/app/ee/authentication/saml-authn/authn-sso-saml-service'
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

    it('refuses a verification when the domain was removed during the DNS lookup', async () => {
        const ctx = await createPlatformWithPendingDomain('verify-removed.example.com')
        vi.mocked(resolveTxt).mockImplementation(async () => {
            await authnSsoSamlService(app.log).updateSsoDomain({ platformId: ctx.platform.id, ssoDomain: null, userId: ctx.user.id, ip: '127.0.0.1' })
            return [[TXT_VALUE]]
        })

        const response = await ctx.post(VERIFY, {})

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(await findEmailDomains(ctx.platform.id)).toHaveLength(0)
        expect(await findPlatformDomain(ctx.platform.id)).toEqual(expect.objectContaining({ ssoDomain: null, ssoDomainVerification: null }))
    })

    it('refuses a verification when the domain was changed during the DNS lookup', async () => {
        const ctx = await createPlatformWithPendingDomain('verify-changed.example.com')
        vi.mocked(resolveTxt).mockImplementation(async () => {
            await authnSsoSamlService(app.log).updateSsoDomain({ platformId: ctx.platform.id, ssoDomain: 'verify-other.example.com', userId: ctx.user.id, ip: '127.0.0.1' })
            return [[TXT_VALUE]]
        })

        const response = await ctx.post(VERIFY, {})

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(await findEmailDomains(ctx.platform.id)).toEqual([expect.objectContaining({
            domain: 'verify-other.example.com',
            verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION,
        })])
        expect(await findPlatformDomain(ctx.platform.id)).toEqual(expect.objectContaining({
            ssoDomain: 'verify-other.example.com',
            ssoDomainVerification: expect.objectContaining({ status: SsoDomainVerificationStatus.PENDING_VERIFICATION }),
        }))
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

async function findPlatformDomain(id: string): Promise<PlatformDomainRow> {
    return databaseConnection().getRepository<PlatformDomainRow>('platform').findOneOrFail({
        where: { id },
        select: { id: true, ssoDomain: true, ssoDomainVerification: true },
    })
}

const VERIFY = '/v1/authn/saml/sso-domain/verify'
const TXT_VALUE = 'activepieces-verify=test-token'

type PlatformDomainRow = {
    id: string
    ssoDomain: string | null
    ssoDomainVerification: SsoDomainVerification | null
}
