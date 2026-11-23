import { resolveTxt } from 'dns/promises'
import { apId } from '@activepieces/core-utils'
import { EmailDomain, EmailDomainWithUsage, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { emailDomainService } from '../../../../src/app/ee/authentication/email-domain/email-domain.service'
import { createTestContext } from '../../../helpers/test-context'
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

describe('Email domains API', () => {
    describe('POST /v1/email-domains', () => {
        it('adds a first domain as pending without the multiple domains flag', async () => {
            const ctx = await createTestContext(app, { plan: { ssoEnabled: true } })

            const response = await ctx.post(EMAIL_DOMAINS, { domain: 'First.example.com ' })

            expect(response.statusCode).toBe(StatusCodes.CREATED)
            expect(response.json()).toEqual(expect.objectContaining({ domain: 'first.example.com', verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION }))
        })

        it('refuses a second domain without the multiple domains flag', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true },
                platform: withDomain({ domain: 'only.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })

            const response = await ctx.post(EMAIL_DOMAINS, { domain: 'second.example.com' })

            expect(response.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
            expect(await findDomains(ctx.platform.id)).toHaveLength(1)
        })

        it('adds a second domain with the multiple domains flag', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: withDomain({ domain: 'main.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })

            const response = await ctx.post(EMAIL_DOMAINS, { domain: 'eu.main.example.com' })

            expect(response.statusCode).toBe(StatusCodes.CREATED)
            expect((await findDomains(ctx.platform.id)).map((emailDomain) => emailDomain.domain).sort()).toEqual(['eu.main.example.com', 'main.example.com'])
        })

        it('refuses a domain another platform verified', async () => {
            await createTestContext(app, {
                plan: { ssoEnabled: true },
                platform: withDomain({ domain: 'owned.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })
            const ctx = await createTestContext(app, { plan: { ssoEnabled: true } })

            const response = await ctx.post(EMAIL_DOMAINS, { domain: 'owned.example.com' })

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
            expect(await findDomains(ctx.platform.id)).toHaveLength(0)
        })

        it('says the domain is in use when another platform claims it in the old column at the same moment', async () => {
            const other = await createTestContext(app, { plan: { ssoEnabled: true } })
            await databaseConnection().getRepository<PlatformSsoRow>('platform').update({ id: other.platform.id }, { ssoDomain: 'raced.example.com' })
            const ctx = await createTestContext(app, { plan: { ssoEnabled: true } })

            const response = await ctx.post(EMAIL_DOMAINS, { domain: 'raced.example.com' })

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
            expect(response.json().params.message).toBe('This SSO domain is already in use')
            expect(await findDomains(ctx.platform.id)).toHaveLength(0)
        })

        it('refuses the same domain twice on one platform', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: withDomain({ domain: 'twice.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION }),
            })

            const response = await ctx.post(EMAIL_DOMAINS, { domain: 'twice.example.com' })

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        })
    })

    describe('GET /v1/email-domains', () => {
        it('lists every domain with its TXT record and the members on it', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: withDomain({ domain: 'listed.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })
            await saveDomain({ platformId: ctx.platform.id, domain: 'other.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION })

            const response = await ctx.get(EMAIL_DOMAINS)
            const domains: EmailDomainWithUsage[] = response.json()

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(domains.map((emailDomain) => [emailDomain.domain, emailDomain.verificationRecordName])).toEqual([
                ['listed.example.com', '_activepieces-verify.listed.example.com'],
                ['other.example.com', '_activepieces-verify.other.example.com'],
            ])
            expect(domains.every((emailDomain) => emailDomain.peopleCount === 0)).toBe(true)
        })
    })

    describe('POST /v1/email-domains/:id/verify', () => {
        it('verifies a second domain with the flag and keeps the first in the platform columns', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: withDomain({ domain: 'first-verified.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })
            const second = await saveDomain({ platformId: ctx.platform.id, domain: 'second-verified.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION })
            vi.mocked(resolveTxt).mockResolvedValue([[TXT_VALUE]])

            const response = await ctx.post(`${EMAIL_DOMAINS}/${second.id}/verify`, {})

            expect(response.json()).toEqual(expect.objectContaining({ verificationStatus: SsoDomainVerificationStatus.VERIFIED }))
            expect(await emailDomainService(app.log).listVerifiedDomains({ platformId: ctx.platform.id })).toHaveLength(2)
            expect((await findPlatform(ctx.platform.id)).ssoDomain).toBe('first-verified.example.com')
        })

        it('refuses a second verified domain without the flag', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true },
                platform: withDomain({ domain: 'kept.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })
            const second = await saveDomain({ platformId: ctx.platform.id, domain: 'downgraded.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION })
            vi.mocked(resolveTxt).mockResolvedValue([[TXT_VALUE]])

            const response = await ctx.post(`${EMAIL_DOMAINS}/${second.id}/verify`, {})

            expect(response.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        })

        it('refuses a verification when the domain was removed during the DNS lookup', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: withDomain({ domain: 'kept-while-racing.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })
            const racing = await saveDomain({ platformId: ctx.platform.id, domain: 'removed-while-racing.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION })
            vi.mocked(resolveTxt).mockImplementation(async () => {
                await emailDomainService(app.log).remove({ platformId: ctx.platform.id, id: racing.id, userId: ctx.user.id, ip: '127.0.0.1' })
                return [[TXT_VALUE]]
            })

            const response = await ctx.post(`${EMAIL_DOMAINS}/${racing.id}/verify`, {})

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
            expect((await findDomains(ctx.platform.id)).map((emailDomain) => emailDomain.domain)).toEqual(['kept-while-racing.example.com'])
        })

        it('says the domain is in use when another platform verifies it at the same moment', async () => {
            const other = await createTestContext(app, { plan: { ssoEnabled: true } })
            const ctx = await createTestContext(app, { plan: { ssoEnabled: true } })
            const pending = await saveDomain({ platformId: ctx.platform.id, domain: 'raced-verify.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION })
            await saveDomain({ platformId: other.platform.id, domain: 'raced-verify.example.com', status: SsoDomainVerificationStatus.VERIFIED })
            vi.mocked(resolveTxt).mockResolvedValue([[TXT_VALUE]])

            const response = await ctx.post(`${EMAIL_DOMAINS}/${pending.id}/verify`, {})

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
            expect(response.json().params.message).toBe('This SSO domain is already in use')
            expect((await findDomains(ctx.platform.id))[0].verificationStatus).toBe(SsoDomainVerificationStatus.PENDING_VERIFICATION)
        })

        it('answers both of two verifications that run at the same time with the verified domain', async () => {
            const ctx = await createTestContext(app, { plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true } })
            const twice = await saveDomain({ platformId: ctx.platform.id, domain: 'verified-twice.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION })
            mockTxtLookupReleasedAfter({ calls: 2 })

            const responses = await Promise.all([
                ctx.post(`${EMAIL_DOMAINS}/${twice.id}/verify`, {}),
                ctx.post(`${EMAIL_DOMAINS}/${twice.id}/verify`, {}),
            ])

            expect(responses.map((response) => response.statusCode)).toEqual([StatusCodes.OK, StatusCodes.OK])
            expect(responses.map((response) => response.json().verificationStatus)).toEqual([SsoDomainVerificationStatus.VERIFIED, SsoDomainVerificationStatus.VERIFIED])
        })
    })

    describe('DELETE /v1/email-domains/:id', () => {
        it('keeps SAML when another verified domain remains', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: { ...withDomain({ domain: 'stays.example.com', status: SsoDomainVerificationStatus.VERIFIED }), federatedAuthProviders: { saml: SAML } },
            })
            const second = await saveDomain({ platformId: ctx.platform.id, domain: 'goes.example.com', status: SsoDomainVerificationStatus.VERIFIED })

            const response = await ctx.delete(`${EMAIL_DOMAINS}/${second.id}`)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect((await findPlatform(ctx.platform.id)).federatedAuthProviders.saml).toEqual(SAML)
            expect((await findDomains(ctx.platform.id)).map((emailDomain) => emailDomain.domain)).toEqual(['stays.example.com'])
        })

        it('turns SAML off with the last verified domain and moves the platform columns to the pending one', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: { ...withDomain({ domain: 'last.example.com', status: SsoDomainVerificationStatus.VERIFIED }), emailAuthEnabled: true, federatedAuthProviders: { saml: SAML } },
            })
            const pending = await saveDomain({ platformId: ctx.platform.id, domain: 'waiting.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION })
            const [last] = (await findDomains(ctx.platform.id)).filter((emailDomain) => emailDomain.id !== pending.id)

            await ctx.delete(`${EMAIL_DOMAINS}/${last.id}`)
            const platform = await findPlatform(ctx.platform.id)

            expect(platform.federatedAuthProviders.saml).toBeNull()
            expect(platform.ssoDomain).toBe('waiting.example.com')
            expect(platform.ssoDomainVerification?.status).toBe(SsoDomainVerificationStatus.PENDING_VERIFICATION)
        })

        it('turns SAML off when the last two verified domains are removed at the same time', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: { ...withDomain({ domain: 'first-of-two.example.com', status: SsoDomainVerificationStatus.VERIFIED }), emailAuthEnabled: true, federatedAuthProviders: { saml: SAML } },
            })
            await saveDomain({ platformId: ctx.platform.id, domain: 'second-of-two.example.com', status: SsoDomainVerificationStatus.VERIFIED })
            const domains = await findDomains(ctx.platform.id)

            await Promise.all(domains.map((emailDomain) => ctx.delete(`${EMAIL_DOMAINS}/${emailDomain.id}`)))

            expect(await findDomains(ctx.platform.id)).toHaveLength(0)
            expect((await findPlatform(ctx.platform.id)).federatedAuthProviders.saml).toBeNull()
        })

        it('never leaves SAML on without a verified domain when SAML is set up while the domain is removed', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true },
                platform: { ...withDomain({ domain: 'only-verified.example.com', status: SsoDomainVerificationStatus.VERIFIED }), emailAuthEnabled: true, federatedAuthProviders: { saml: null } },
            })
            const [only] = await findDomains(ctx.platform.id)

            await Promise.all([
                ctx.delete(`${EMAIL_DOMAINS}/${only.id}`),
                ctx.post(`/v1/platforms/${ctx.platform.id}`, { federatedAuthProviders: { saml: SAML } }),
            ])

            expect(await findDomains(ctx.platform.id)).toHaveLength(0)
            expect((await findPlatform(ctx.platform.id)).federatedAuthProviders.saml).toBeNull()
        })

        it('does not remove another platform\'s domain', async () => {
            const owner = await createTestContext(app, {
                plan: { ssoEnabled: true },
                platform: withDomain({ domain: 'not-yours.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })
            const [ownersDomain] = await findDomains(owner.platform.id)
            const ctx = await createTestContext(app, { plan: { ssoEnabled: true } })

            const response = await ctx.delete(`${EMAIL_DOMAINS}/${ownersDomain.id}`)

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(await findDomains(owner.platform.id)).toHaveLength(1)
        })
    })

    describe('old /v1/authn/saml/sso-domain endpoint', () => {
        it('changes only the domain shown in the platform columns', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: withDomain({ domain: 'shown.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
            })
            await saveDomain({ platformId: ctx.platform.id, domain: 'hidden.example.com', status: SsoDomainVerificationStatus.VERIFIED })

            await ctx.post(SSO_DOMAIN, { ssoDomain: null })

            expect((await findDomains(ctx.platform.id)).map((emailDomain) => emailDomain.domain)).toEqual(['hidden.example.com'])
            expect((await findPlatform(ctx.platform.id)).ssoDomain).toBe('hidden.example.com')
        })
    })

    describe('expirePending', () => {
        it('drops a pending domain after 7 days and keeps the verified one in the platform columns', async () => {
            const ctx = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: withDomain({ domain: 'old-pending.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION, createdAt: daysAgo(8) }),
            })
            await saveDomain({ platformId: ctx.platform.id, domain: 'fresh-verified.example.com', status: SsoDomainVerificationStatus.VERIFIED })

            await emailDomainService(app.log).expirePending()

            expect((await findDomains(ctx.platform.id)).map((emailDomain) => emailDomain.domain)).toEqual(['fresh-verified.example.com'])
            expect((await findPlatform(ctx.platform.id)).ssoDomain).toBe('fresh-verified.example.com')
        })

        it('expires domains on several platforms in one run and refreshes each platform\'s columns', async () => {
            const withVerified = await createTestContext(app, {
                plan: { ssoEnabled: true, multipleEmailDomainsEnabled: true },
                platform: withDomain({ domain: 'expired-beside-verified.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION, createdAt: daysAgo(8) }),
            })
            await saveDomain({ platformId: withVerified.platform.id, domain: 'stays-verified.example.com', status: SsoDomainVerificationStatus.VERIFIED })
            const pendingOnly = await createTestContext(app, {
                plan: { ssoEnabled: true },
                platform: withDomain({ domain: 'expired-alone.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION, createdAt: daysAgo(8) }),
            })

            await emailDomainService(app.log).expirePending()
            const keptPlatform = await findPlatform(withVerified.platform.id)
            const emptiedPlatform = await findPlatform(pendingOnly.platform.id)

            expect(keptPlatform.ssoDomain).toBe('stays-verified.example.com')
            expect(keptPlatform.ssoDomainVerification?.status).toBe(SsoDomainVerificationStatus.VERIFIED)
            expect(await findDomains(pendingOnly.platform.id)).toHaveLength(0)
            expect(emptiedPlatform.ssoDomain).toBeNull()
            expect(emptiedPlatform.ssoDomainVerification).toBeNull()
        })
    })
})

function withDomain({ domain, status, createdAt = daysAgo(1) }: WithDomainParams): { ssoDomain: string, ssoDomainVerification: SsoDomainVerification } {
    return {
        ssoDomain: domain,
        ssoDomainVerification: {
            status,
            record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domain}`, value: TXT_VALUE },
            createdAt,
        },
    }
}

async function saveDomain({ platformId, domain, status }: SaveDomainParams): Promise<EmailDomain> {
    return databaseConnection().getRepository<EmailDomain>('email_domain').save({
        id: apId(),
        platformId,
        domain,
        verificationStatus: status,
        verificationRecordValue: TXT_VALUE,
    })
}

async function findDomains(platformId: string): Promise<EmailDomain[]> {
    return databaseConnection().getRepository<EmailDomain>('email_domain').find({ where: { platformId }, order: { created: 'ASC' } })
}

async function findPlatform(id: string): Promise<PlatformSsoRow> {
    return databaseConnection().getRepository<PlatformSsoRow>('platform').findOneOrFail({
        where: { id },
        select: { id: true, ssoDomain: true, ssoDomainVerification: true, federatedAuthProviders: true },
    })
}

function mockTxtLookupReleasedAfter({ calls }: { calls: number }): void {
    let waiting = 0
    let release: () => void = () => undefined
    const released = new Promise<void>((resolve) => {
        release = resolve
    })
    vi.mocked(resolveTxt).mockImplementation(async () => {
        waiting += 1
        if (waiting === calls) {
            release()
        }
        await released
        return [[TXT_VALUE]]
    })
}

function daysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const EMAIL_DOMAINS = '/v1/email-domains'
const SSO_DOMAIN = '/v1/authn/saml/sso-domain'
const TXT_VALUE = 'activepieces-verify=test-token'

const SAML = {
    idpMetadata: '<EntityDescriptor />',
    idpCertificate: 'test-certificate',
}

type WithDomainParams = {
    domain: string
    status: SsoDomainVerificationStatus
    createdAt?: string
}

type SaveDomainParams = {
    platformId: string
    domain: string
    status: SsoDomainVerificationStatus
}

type PlatformSsoRow = {
    id: string
    ssoDomain: string | null
    ssoDomainVerification: { status: string } | null
    federatedAuthProviders: { saml: unknown }
}
