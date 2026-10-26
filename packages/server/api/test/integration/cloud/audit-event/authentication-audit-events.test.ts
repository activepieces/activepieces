import { ApplicationEvent, ApplicationEventName, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { auditLogRepo } from '../../../../src/app/ee/audit-logs/audit-event-service'
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

describe('Authentication audit events', () => {
    it('records who turned off email sign-in', async () => {
        const ctx = await createTestContext(app!, { platform: { emailAuthEnabled: true }, plan: { auditLogEnabled: true } })

        await ctx.inject({
            method: 'POST',
            url: `/api/v1/platforms/${ctx.platform.id}`,
            body: { emailAuthEnabled: false },
            headers: { 'x-real-ip': '203.0.113.7' },
        })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 1 })

        expect(events).toEqual([expect.objectContaining({
            action: ApplicationEventName.EMAIL_SIGN_IN_DISABLED,
            userId: ctx.user.id,
            userEmail: ctx.userIdentity.email,
            ip: '203.0.113.7',
        })])
    })

    it('records nothing for a save that leaves authentication as it was', async () => {
        const ctx = await createTestContext(app!, {
            platform: { emailAuthEnabled: true, allowedAuthDomains: ['a.com', 'b.com'] },
            plan: { auditLogEnabled: true },
        })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { name: 'Renamed', emailAuthEnabled: true, allowedAuthDomains: ['b.com', 'a.com'] })
        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { emailAuthEnabled: false })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 1 })

        expect(events.map((event) => event.action)).toEqual([ApplicationEventName.EMAIL_SIGN_IN_DISABLED])
    })

    it('records one row per allowed domain added and removed', async () => {
        const ctx = await createTestContext(app!, { platform: { allowedAuthDomains: ['a.com', 'b.com'] }, plan: { auditLogEnabled: true } })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { allowedAuthDomains: ['b.com', 'c.com'], enforceAllowedAuthDomains: true })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 3 })

        expect(events).toEqual(expect.arrayContaining([
            domainEvent({ action: ApplicationEventName.ALLOWED_DOMAIN_ADDED, domain: 'c.com' }),
            domainEvent({ action: ApplicationEventName.ALLOWED_DOMAIN_REMOVED, domain: 'a.com' }),
            expect.objectContaining({ action: ApplicationEventName.ALLOWED_DOMAIN_ENFORCEMENT_ENABLED }),
        ]))
    })

    it('records allowed-domain enforcement being turned off', async () => {
        const ctx = await createTestContext(app!, { platform: { allowedAuthDomains: ['acme.com'], enforceAllowedAuthDomains: true }, plan: { auditLogEnabled: true } })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { enforceAllowedAuthDomains: false })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 1 })

        expect(events.map((event) => event.action)).toEqual([ApplicationEventName.ALLOWED_DOMAIN_ENFORCEMENT_DISABLED])
    })

    it('records allowed-domain enforcement being turned on without a domain change', async () => {
        const ctx = await createTestContext(app!, { platform: { allowedAuthDomains: ['acme.com'], enforceAllowedAuthDomains: false }, plan: { auditLogEnabled: true } })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { enforceAllowedAuthDomains: true })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 1 })

        expect(events.map((event) => event.action)).toEqual([ApplicationEventName.ALLOWED_DOMAIN_ENFORCEMENT_ENABLED])
    })

    it('records only the new domain when another is added while enforcement is already on', async () => {
        const ctx = await createTestContext(app!, {
            platform: { emailAuthEnabled: true, allowedAuthDomains: ['acme.com'], enforceAllowedAuthDomains: true },
            plan: { auditLogEnabled: true },
        })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { allowedAuthDomains: ['acme.com', 'acme.io'], enforceAllowedAuthDomains: true })
        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { emailAuthEnabled: false })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 2 })

        expect(sortedActions(events)).toEqual([ApplicationEventName.ALLOWED_DOMAIN_ADDED, ApplicationEventName.EMAIL_SIGN_IN_DISABLED].sort())
        expect(events).toEqual(expect.arrayContaining([domainEvent({ action: ApplicationEventName.ALLOWED_DOMAIN_ADDED, domain: 'acme.io' })]))
    })

    it('records the last domain removal and enforcement turning off', async () => {
        const ctx = await createTestContext(app!, { platform: { allowedAuthDomains: ['acme.com'], enforceAllowedAuthDomains: true }, plan: { auditLogEnabled: true } })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { allowedAuthDomains: [], enforceAllowedAuthDomains: false })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 2 })

        expect(sortedActions(events)).toEqual([ApplicationEventName.ALLOWED_DOMAIN_REMOVED, ApplicationEventName.ALLOWED_DOMAIN_ENFORCEMENT_DISABLED].sort())
        expect(events).toEqual(expect.arrayContaining([domainEvent({ action: ApplicationEventName.ALLOWED_DOMAIN_REMOVED, domain: 'acme.com' })]))
    })

    it('treats a case-only change to an allowed domain as no change', async () => {
        const ctx = await createTestContext(app!, { platform: { emailAuthEnabled: true, allowedAuthDomains: ['acme.com'] }, plan: { auditLogEnabled: true } })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { allowedAuthDomains: ['ACME.com'] })
        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { emailAuthEnabled: false })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 1 })

        expect(events.map((event) => event.action)).toEqual([ApplicationEventName.EMAIL_SIGN_IN_DISABLED])
    })

    it('records a newly added domain as saved, ignoring a case-only change to another', async () => {
        const ctx = await createTestContext(app!, {
            platform: { emailAuthEnabled: true, allowedAuthDomains: ['acme.com'] },
            plan: { auditLogEnabled: true },
        })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { allowedAuthDomains: ['ACME.com', 'New.io'] })
        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { emailAuthEnabled: false })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 2 })

        expect(sortedActions(events)).toEqual([ApplicationEventName.ALLOWED_DOMAIN_ADDED, ApplicationEventName.EMAIL_SIGN_IN_DISABLED].sort())
        expect(events).toEqual(expect.arrayContaining([domainEvent({ action: ApplicationEventName.ALLOWED_DOMAIN_ADDED, domain: 'New.io' })]))
    })

    it('records the SSO domain being added and its verification being cancelled', async () => {
        const ctx = await createTestContext(app!, { plan: { auditLogEnabled: true, ssoEnabled: true } })

        await ctx.post(SSO_DOMAIN, { ssoDomain: 'pending.example.com' })
        await ctx.post(SSO_DOMAIN, { ssoDomain: null })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 2 })

        expect(events).toEqual(expect.arrayContaining([
            domainEvent({ action: ApplicationEventName.SSO_DOMAIN_ADDED, domain: 'pending.example.com', userId: ctx.user.id }),
            domainEvent({ action: ApplicationEventName.SSO_DOMAIN_VERIFICATION_CANCELLED, domain: 'pending.example.com', userId: ctx.user.id }),
        ]))
    })

    it('records the domain removal and single sign-on being disabled as two rows', async () => {
        const ctx = await createTestContext(app!, {
            plan: { auditLogEnabled: true, ssoEnabled: true },
            platform: {
                ssoDomain: 'verified.example.com',
                ssoDomainVerification: verification({ domain: 'verified.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
                federatedAuthProviders: { saml: SAML },
            },
        })

        await ctx.post(SSO_DOMAIN, { ssoDomain: null })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 2 })

        expect(events.map((event) => event.action)).toEqual(expect.arrayContaining([
            ApplicationEventName.SSO_DOMAIN_REMOVED,
            ApplicationEventName.SSO_DISABLED,
        ]))
    })

    it('records a replaced SAML connection, and nothing when the same values are saved again', async () => {
        const ctx = await createTestContext(app!, {
            plan: { auditLogEnabled: true, ssoEnabled: true },
            platform: {
                ssoDomain: 'saml.example.com',
                ssoDomainVerification: verification({ domain: 'saml.example.com', status: SsoDomainVerificationStatus.VERIFIED }),
                federatedAuthProviders: { saml: SAML },
            },
        })

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { federatedAuthProviders: { saml: SAML } })
        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { federatedAuthProviders: { saml: { ...SAML, idpCertificate: 'rotated-certificate' } } })
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 1 })

        expect(events.map((event) => event.action)).toEqual([ApplicationEventName.SAML_CONNECTION_REPLACED])
    })

    it('records an expired domain with no user', async () => {
        const ctx = await createTestContext(app!, {
            plan: { auditLogEnabled: true, ssoEnabled: true },
            platform: {
                ssoDomain: 'expired.example.com',
                ssoDomainVerification: {
                    ...verification({ domain: 'expired.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION }),
                    createdAt: dayjs().subtract(8, 'days').toISOString(),
                },
            },
        })

        await authnSsoSamlService(app!.log).expirePendingSsoDomains()
        const events = await savedEvents({ platformId: ctx.platform.id, expectedCount: 1 })

        expect(events).toEqual([domainEvent({ action: ApplicationEventName.SSO_DOMAIN_EXPIRED, domain: 'expired.example.com', userId: null })])
    })
})

async function savedEvents({ platformId, expectedCount }: { platformId: string, expectedCount: number }): Promise<ApplicationEvent[]> {
    const find = async (): Promise<ApplicationEvent[]> => auditLogRepo().find({ where: { platformId }, order: { created: 'ASC' } })
    await vi.waitUntil(async () => (await find()).length >= expectedCount, { timeout: 5000, interval: 50 })
    return find()
}

function sortedActions(events: ApplicationEvent[]): ApplicationEventName[] {
    return events.map((event) => event.action).sort()
}

function domainEvent({ action, domain, userId }: { action: ApplicationEventName, domain: string, userId?: string | null }): unknown {
    return expect.objectContaining({
        action,
        data: expect.objectContaining({ domain }),
        ...(userId === undefined ? {} : { userId }),
    })
}

function verification({ domain, status }: { domain: string, status: SsoDomainVerificationStatus }): SsoDomainVerification {
    return {
        status,
        record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domain}`, value: 'activepieces-verify=test-token' },
        createdAt: new Date().toISOString(),
    }
}

const SSO_DOMAIN = '/v1/authn/saml/sso-domain'

const SAML = {
    idpMetadata: '<EntityDescriptor />',
    idpCertificate: 'test-certificate',
}
