import { EmailDomain, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { authnSsoSamlService } from '../../../../src/app/ee/authentication/saml-authn/authn-sso-saml-service'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('SSO domain API', () => {
    describe('POST /v1/authn/saml/sso-domain', () => {
        it('removing the domain also clears its verification and turns SAML off', async () => {
            const ctx = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    emailAuthEnabled: true,
                    ssoDomain: 'remove-with-saml.example.com',
                    ssoDomainVerification: verified('remove-with-saml.example.com'),
                    federatedAuthProviders: { saml: SAML },
                },
            })

            const response = await ctx.post(SSO_DOMAIN, { ssoDomain: null })
            const platform = await findPlatform(ctx.platform.id)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(platform.ssoDomain).toBeNull()
            expect(platform.ssoDomainVerification).toBeNull()
            expect(platform.federatedAuthProviders.saml).toBeNull()
        })

        it('removing a domain without SAML clears only the domain', async () => {
            const ctx = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'remove-only.example.com',
                    ssoDomainVerification: verified('remove-only.example.com'),
                    federatedAuthProviders: { saml: null },
                },
            })

            const response = await ctx.post(SSO_DOMAIN, { ssoDomain: null })
            const platform = await findPlatform(ctx.platform.id)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(platform.ssoDomain).toBeNull()
            expect(platform.ssoDomainVerification).toBeNull()
            expect(platform.federatedAuthProviders.saml).toBeNull()
        })

        it('cancelling a pending domain keeps SAML, like an expired one', async () => {
            const ctx = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'cancel-pending.example.com',
                    ssoDomainVerification: pending('cancel-pending.example.com'),
                    federatedAuthProviders: { saml: SAML },
                },
            })

            const response = await ctx.post(SSO_DOMAIN, { ssoDomain: null })
            const platform = await findPlatform(ctx.platform.id)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(platform.ssoDomain).toBeNull()
            expect(platform.ssoDomainVerification).toBeNull()
            expect(platform.federatedAuthProviders.saml).toEqual(SAML)
        })

        it('adding a removed domain back needs a new DNS record', async () => {
            const ctx = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 're-add.example.com',
                    ssoDomainVerification: verified('re-add.example.com'),
                },
            })

            await ctx.post(SSO_DOMAIN, { ssoDomain: null })
            const response = await ctx.post(SSO_DOMAIN, { ssoDomain: 're-add.example.com' })
            const platform = await findPlatform(ctx.platform.id)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(platform.ssoDomainVerification?.status).toBe(SsoDomainVerificationStatus.PENDING_VERIFICATION)
            expect(platform.ssoDomainVerification?.record.value).not.toBe('activepieces-verify=test-token')
        })

        it('saving the same domain keeps its verification and SAML', async () => {
            const ctx = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'same-domain.example.com',
                    ssoDomainVerification: verified('same-domain.example.com'),
                    federatedAuthProviders: { saml: SAML },
                },
            })

            const response = await ctx.post(SSO_DOMAIN, { ssoDomain: 'Same-Domain.example.com ' })
            const platform = await findPlatform(ctx.platform.id)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(platform.ssoDomain).toBe('same-domain.example.com')
            expect(platform.ssoDomainVerification?.status).toBe(SsoDomainVerificationStatus.VERIFIED)
            expect(platform.federatedAuthProviders.saml).not.toBeNull()
        })

        it('setting a new domain starts a pending verification', async () => {
            const ctx = await createTestContext(app!, { plan: { ssoEnabled: true } })

            const response = await ctx.post(SSO_DOMAIN, { ssoDomain: 'fresh-domain.example.com' })
            const platform = await findPlatform(ctx.platform.id)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(platform.ssoDomain).toBe('fresh-domain.example.com')
            expect(platform.ssoDomainVerification?.status).toBe(SsoDomainVerificationStatus.PENDING_VERIFICATION)
        })

        it('refuses a domain another platform already uses', async () => {
            await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'taken.example.com',
                    ssoDomainVerification: verified('taken.example.com'),
                },
            })
            const ctx = await createTestContext(app!, { plan: { ssoEnabled: true } })

            const response = await ctx.post(SSO_DOMAIN, { ssoDomain: 'taken.example.com' })
            const platform = await findPlatform(ctx.platform.id)

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
            expect(platform.ssoDomain).toBeNull()
        })
    })

    describe('expirePendingSsoDomains', () => {
        it('keeps a pending domain for 7 days, then drops it', async () => {
            const sixDays = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'six-days.example.com',
                    ssoDomainVerification: { ...pending('six-days.example.com'), createdAt: daysAgo(6) },
                },
            })
            const eightDays = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'eight-days.example.com',
                    ssoDomainVerification: { ...pending('eight-days.example.com'), createdAt: daysAgo(8) },
                },
            })
            const verifiedLongAgo = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'verified-long-ago.example.com',
                    ssoDomainVerification: { ...verified('verified-long-ago.example.com'), createdAt: daysAgo(30) },
                },
            })

            await authnSsoSamlService(app!.log).expirePendingSsoDomains()

            expect((await findPlatform(sixDays.platform.id)).ssoDomain).toBe('six-days.example.com')
            expect((await findPlatform(eightDays.platform.id)).ssoDomain).toBeNull()
            expect((await findPlatform(eightDays.platform.id)).ssoDomainVerification).toBeNull()
            expect((await findPlatform(verifiedLongAgo.platform.id)).ssoDomain).toBe('verified-long-ago.example.com')
            expect(await findEmailDomains(sixDays.platform.id)).toHaveLength(1)
            expect(await findEmailDomains(eightDays.platform.id)).toHaveLength(0)
            expect(await findEmailDomains(verifiedLongAgo.platform.id)).toHaveLength(1)
        })
    })

    describe('email_domain table', () => {
        it('saves a new domain as pending, with its TXT value', async () => {
            const ctx = await createTestContext(app!, { plan: { ssoEnabled: true } })

            await ctx.post(SSO_DOMAIN, { ssoDomain: 'table-new.example.com' })
            const platform = await findPlatform(ctx.platform.id)

            expect(await findEmailDomains(ctx.platform.id)).toEqual([expect.objectContaining({
                domain: 'table-new.example.com',
                verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION,
                verificationRecordValue: platform.ssoDomainVerification?.record.value,
            })])
        })

        it('replaces the row when the domain changes', async () => {
            const ctx = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'table-old.example.com',
                    ssoDomainVerification: verified('table-old.example.com'),
                },
            })

            await ctx.post(SSO_DOMAIN, { ssoDomain: 'table-changed.example.com' })

            expect(await findEmailDomains(ctx.platform.id)).toEqual([expect.objectContaining({
                domain: 'table-changed.example.com',
                verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION,
            })])
        })

        it('keeps the claim start date when the same domain is saved again', async () => {
            const claimStartedAt = '2026-03-01T10:00:00.000Z'
            const ctx = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'table-same.example.com',
                    ssoDomainVerification: { ...verified('table-same.example.com'), createdAt: claimStartedAt },
                },
            })

            await ctx.post(SSO_DOMAIN, { ssoDomain: 'table-same.example.com' })

            expect(await findEmailDomains(ctx.platform.id)).toEqual([expect.objectContaining({
                domain: 'table-same.example.com',
                created: new Date(claimStartedAt),
            })])
        })

        it('deletes the row when the domain is removed', async () => {
            const ctx = await createTestContext(app!, {
                plan: { ssoEnabled: true },
                platform: {
                    ssoDomain: 'table-removed.example.com',
                    ssoDomainVerification: verified('table-removed.example.com'),
                },
            })

            await ctx.post(SSO_DOMAIN, { ssoDomain: null })

            expect(await findEmailDomains(ctx.platform.id)).toHaveLength(0)
        })
    })
})

async function findPlatform(id: string): Promise<PlatformSsoRow> {
    return databaseConnection().getRepository<PlatformSsoRow>('platform').findOneOrFail({
        where: { id },
        select: { id: true, ssoDomain: true, ssoDomainVerification: true, federatedAuthProviders: true },
    })
}

async function findEmailDomains(platformId: string): Promise<EmailDomain[]> {
    return databaseConnection().getRepository<EmailDomain>('email_domain').findBy({ platformId })
}

function verified(domain: string): SsoDomainVerification {
    return {
        status: SsoDomainVerificationStatus.VERIFIED,
        record: {
            type: SsoDomainVerificationRecordType.TXT,
            name: `_activepieces-verify.${domain}`,
            value: 'activepieces-verify=test-token',
        },
        createdAt: new Date().toISOString(),
    }
}

function pending(domain: string): SsoDomainVerification {
    return {
        ...verified(domain),
        status: SsoDomainVerificationStatus.PENDING_VERIFICATION,
    }
}

function daysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const SSO_DOMAIN = '/v1/authn/saml/sso-domain'

const SAML = {
    idpMetadata: '<EntityDescriptor />',
    idpCertificate: 'test-certificate',
}

type PlatformSsoRow = {
    id: string
    ssoDomain: string | null
    ssoDomainVerification: { status: string, record: { value: string } } | null
    federatedAuthProviders: { saml: unknown }
}
