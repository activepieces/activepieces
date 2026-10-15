import { SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
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
})

async function findPlatform(id: string): Promise<PlatformSsoRow> {
    return databaseConnection().getRepository<PlatformSsoRow>('platform').findOneOrFail({
        where: { id },
        select: { id: true, ssoDomain: true, ssoDomainVerification: true, federatedAuthProviders: true },
    })
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
