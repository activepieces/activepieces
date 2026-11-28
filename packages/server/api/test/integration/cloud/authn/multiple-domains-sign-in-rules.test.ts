import { resolveTxt } from 'dns/promises'
import { apId } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, OtpType, PlatformRole, PrincipalType, SsoDomainVerificationRecordType, SsoDomainVerificationStatus, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { authenticationService } from '../../../../src/app/authentication/authentication.service'
import { turnstile } from '../../../../src/app/authentication/lib/turnstile'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUserInvitation, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { createMockSignInRequest, createMockSignUpRequest } from '../../../helpers/mocks/authn'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

process.env.AP_TURNSTILE_SITE_KEY = 'test-site-key'
process.env.AP_TURNSTILE_SECRET_KEY = 'test-secret-key'

const googleAccount = vi.hoisted(() => ({
    email: '',
    firstName: 'test',
    lastName: 'person',
}))

vi.mock('../../../../src/app/ee/authentication/federated-authn/google-authn-provider', () => ({
    googleAuthnProvider: () => ({
        getLoginUrl: () => Promise.resolve('https://accounts.google.com/o/oauth2/v2/auth'),
        authenticate: () => Promise.resolve(googleAccount),
    }),
}))

vi.mock('dns/promises', () => ({
    resolveTxt: vi.fn(),
}))

let app: FastifyInstance
let log: FastifyBaseLogger
let ipCounter = 0

beforeAll(async () => {
    vi.spyOn(turnstile, 'assertSolved').mockResolvedValue(undefined)
    app = await setupTestEnvironment()
    log = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    vi.mocked(resolveTxt).mockResolvedValue([[TXT_VALUE]])
})

afterEach(() => {
    delete process.env.AP_GOOGLE_CLIENT_ID
    delete process.env.AP_GOOGLE_CLIENT_SECRET
})

describe('Every sign-in method on every verified domain', () => {
    it.each([
        { config: 'email on, Google on, no SAML', email: true, google: true, saml: false, person: 'first', expected: { password: OK, code: OK, google: OK, saml: NOT_ALLOWED } },
        { config: 'email on, Google on, no SAML', email: true, google: true, saml: false, person: 'second', expected: { password: OK, code: OK, google: OK, saml: NOT_ALLOWED } },
        { config: 'email on, Google on, no SAML', email: true, google: true, saml: false, person: 'pending', expected: { password: OK, code: OK, google: OK, saml: DOMAIN_NOT_ALLOWED } },

        { config: 'email off, Google on, no SAML', email: false, google: true, saml: false, person: 'first', expected: { password: NOT_ALLOWED, code: NOT_ALLOWED, google: OK, saml: NOT_ALLOWED } },
        { config: 'email off, Google on, no SAML', email: false, google: true, saml: false, person: 'second', expected: { password: NOT_ALLOWED, code: NOT_ALLOWED, google: OK, saml: NOT_ALLOWED } },
        { config: 'email off, Google on, no SAML', email: false, google: true, saml: false, person: 'pending', expected: { password: OK, code: OK, google: OK, saml: DOMAIN_NOT_ALLOWED } },

        { config: 'email on, Google off, no SAML', email: true, google: false, saml: false, person: 'first', expected: { password: OK, code: OK, google: NOT_ALLOWED, saml: NOT_ALLOWED } },
        { config: 'email on, Google off, no SAML', email: true, google: false, saml: false, person: 'second', expected: { password: OK, code: OK, google: NOT_ALLOWED, saml: NOT_ALLOWED } },
        { config: 'email on, Google off, no SAML', email: true, google: false, saml: false, person: 'pending', expected: { password: OK, code: OK, google: OK, saml: DOMAIN_NOT_ALLOWED } },

        { config: 'email off, Google off, SAML on', email: false, google: false, saml: true, person: 'first', expected: { password: NOT_ALLOWED, code: NOT_ALLOWED, google: NOT_ALLOWED, saml: OK } },
        { config: 'email off, Google off, SAML on', email: false, google: false, saml: true, person: 'second', expected: { password: NOT_ALLOWED, code: NOT_ALLOWED, google: NOT_ALLOWED, saml: OK } },
        { config: 'email off, Google off, SAML on', email: false, google: false, saml: true, person: 'pending', expected: { password: OK, code: OK, google: OK, saml: DOMAIN_NOT_ALLOWED } },

        { config: 'email on, Google on, SAML on', email: true, google: true, saml: true, person: 'first', expected: { password: OK, code: OK, google: OK, saml: OK } },
        { config: 'email on, Google on, SAML on', email: true, google: true, saml: true, person: 'second', expected: { password: OK, code: OK, google: OK, saml: OK } },
        { config: 'email on, Google on, SAML on', email: true, google: true, saml: true, person: 'pending', expected: { password: OK, code: OK, google: OK, saml: DOMAIN_NOT_ALLOWED } },
    ])('$config: member on the $person domain', async ({ email, google, saml, person, expected }) => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: email, googleAuthEnabled: google, saml })
        const member = setup.members[person as MemberKey]

        expect({
            password: await tryPassword(member),
            code: await tryCode(member),
            google: await tryGoogle(member),
            saml: await trySaml({ email: member, platformId: setup.platformId }),
        }).toEqual(expected)
    })

    it('governs an email on a verified domain whatever its letter case', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: false, googleAuthEnabled: true, saml: false })
        const upper = setup.members.second.toUpperCase()

        expect(await tryPassword(upper)).toBe(NOT_ALLOWED)
    })

    it('does not govern a subdomain of a verified domain', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: true, googleAuthEnabled: false, saml: false })
        const subdomainEmail = `lina@eu.${setup.domains.second}`
        await mockBasicUser({
            user: { platformId: setup.platformId, platformRole: PlatformRole.MEMBER, status: UserStatus.ACTIVE },
            userIdentity: { email: subdomainEmail, password: PASSWORD, verified: true },
        })

        expect(await tryGoogle(subdomainEmail)).toBe(OK)
    })
})

describe('Adding, verifying and removing a domain changes who is governed', () => {
    it('releases members of a removed domain and keeps the other verified domain governed', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: true, googleAuthEnabled: false, saml: true })
        expect(await tryGoogle(setup.members.second)).toBe(NOT_ALLOWED)

        const response = await asOwner(setup).delete(`/api/v1/email-domains/${setup.domainIds.second}`)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(await tryGoogle(setup.members.second)).toBe(OK)
        expect(await trySaml({ email: setup.members.second, platformId: setup.platformId })).toBe(DOMAIN_NOT_ALLOWED)
        expect(await tryGoogle(setup.members.first)).toBe(NOT_ALLOWED)
        expect(await trySaml({ email: setup.members.first, platformId: setup.platformId })).toBe(OK)
        expect(await samlIsSetUp(setup.platformId)).toBe(true)
    })

    it('turns SAML off with the last verified domain and releases everyone', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: true, googleAuthEnabled: false, saml: true })

        expect((await asOwner(setup).delete(`/api/v1/email-domains/${setup.domainIds.second}`)).statusCode).toBe(StatusCodes.OK)
        expect((await asOwner(setup).delete(`/api/v1/email-domains/${setup.domainIds.first}`)).statusCode).toBe(StatusCodes.OK)

        expect(await samlIsSetUp(setup.platformId)).toBe(false)
        expect(await tryGoogle(setup.members.first)).toBe(OK)
        expect(await tryGoogle(setup.members.second)).toBe(OK)
        expect(await tryPassword(setup.members.first)).toBe(OK)
    })

    it('refuses removing the last verified domain while SAML is the only method', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: false, googleAuthEnabled: false, saml: true })

        expect((await asOwner(setup).delete(`/api/v1/email-domains/${setup.domainIds.second}`)).statusCode).toBe(StatusCodes.OK)
        const last = await asOwner(setup).delete(`/api/v1/email-domains/${setup.domainIds.first}`)

        expect(last.statusCode).toBe(StatusCodes.CONFLICT)
        expect(await samlIsSetUp(setup.platformId)).toBe(true)
        expect(await trySaml({ email: setup.members.first, platformId: setup.platformId })).toBe(OK)
    })

    it('governs members of a pending domain once it is verified', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: true, googleAuthEnabled: false, saml: true })
        expect(await tryGoogle(setup.members.pending)).toBe(OK)

        const response = await asOwner(setup).post(`/api/v1/email-domains/${setup.domainIds.pending}/verify`)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().verificationStatus).toBe(SsoDomainVerificationStatus.VERIFIED)
        expect(await tryGoogle(setup.members.pending)).toBe(NOT_ALLOWED)
        expect(await trySaml({ email: setup.members.pending, platformId: setup.platformId })).toBe(OK)
    })

    it('does not govern members of a domain that was just added', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: true, googleAuthEnabled: false, saml: true })
        const newDomain = uniqueDomain()
        const newcomer = `sam@${newDomain}`
        await mockBasicUser({
            user: { platformId: setup.platformId, platformRole: PlatformRole.MEMBER, status: UserStatus.ACTIVE },
            userIdentity: { email: newcomer, password: PASSWORD, verified: true },
        })

        const response = await asOwner(setup).post('/api/v1/email-domains', { domain: newDomain })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(await tryGoogle(newcomer)).toBe(OK)
        expect(await trySaml({ email: newcomer, platformId: setup.platformId })).toBe(DOMAIN_NOT_ALLOWED)
    })

    it('keeps both verified domains governed after the plan loses multiple domains, and blocks verifying a third', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: false, googleAuthEnabled: true, saml: false, multipleEmailDomainsEnabled: false })

        expect(await tryPassword(setup.members.first)).toBe(NOT_ALLOWED)
        expect(await tryPassword(setup.members.second)).toBe(NOT_ALLOWED)
        const verify = await asOwner(setup).post(`/api/v1/email-domains/${setup.domainIds.pending}/verify`)
        expect(verify.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(await tryPassword(setup.members.pending)).toBe(OK)
    })

    it('stops governing every domain when the plan loses single sign-on', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: false, googleAuthEnabled: false, saml: false, ssoEnabled: false })

        expect(await tryPassword(setup.members.first)).toBe(OK)
        expect(await tryPassword(setup.members.second)).toBe(OK)
        expect(await tryGoogle(setup.members.second)).toBe(OK)
    })
})

describe('Signing up on a verified domain', () => {
    it.each(['first', 'second'] as const)('refuses an invitee on the %s domain every method the platform turned off, before an account exists', async (domainKey) => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: false, googleAuthEnabled: false, saml: true })
        const invitee = `new-${apId().toLowerCase()}@${setup.domains[domainKey]}`
        await saveAcceptedInvitation({ email: invitee, platformId: setup.platformId })

        expect(await tryPasswordSignUp(invitee)).toBe(NOT_ALLOWED)
        expect(await tryGoogle(invitee)).toBe(NOT_ALLOWED)
        expect(await storedIdentity(invitee)).toBeNull()
        expect(await tryCode(invitee)).toBe(NOT_ALLOWED)
    })

    it('signs an invitee on the second domain up through SAML', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: false, googleAuthEnabled: false, saml: true })
        const invitee = `new-${apId().toLowerCase()}@${setup.domains.second}`
        await saveAcceptedInvitation({ email: invitee, platformId: setup.platformId })

        expect(await trySaml({ email: invitee, platformId: setup.platformId })).toBe(OK)
        expect(await storedIdentity(invitee)).not.toBeNull()
    })

    it('treats an invitee on the pending domain as a guest', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: true, googleAuthEnabled: false, saml: true })
        const invitee = `new-${apId().toLowerCase()}@${setup.domains.pending}`
        await saveAcceptedInvitation({ email: invitee, platformId: setup.platformId })

        expect(await tryGoogle(invitee)).toBe(OK)
    })

    it('lets someone on a verified domain who is neither a member nor invited create an account, which then asks them to verify their email', async () => {
        const setup = await saveTwoDomainPlatform({ emailAuthEnabled: false, googleAuthEnabled: false, saml: true })
        const stranger = `stranger-${apId().toLowerCase()}@${setup.domains.second}`

        expect(await tryPasswordSignUp(stranger)).toBe('EMAIL_IS_NOT_VERIFIED')
        expect(await storedIdentity(stranger)).not.toBeNull()
    })
})

async function saveTwoDomainPlatform({ emailAuthEnabled, googleAuthEnabled, saml, multipleEmailDomainsEnabled = true, ssoEnabled = true }: SaveTwoDomainPlatformParams): Promise<TwoDomainPlatform> {
    const domains = { first: uniqueDomain(), second: uniqueDomain(), pending: uniqueDomain() }
    const members = { first: `maya@${domains.first}`, second: `omar@${domains.second}`, pending: `lea@${domains.pending}` }
    const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup({
        userIdentity: { email: members.first, password: PASSWORD },
        platform: {
            emailAuthEnabled,
            googleAuthEnabled,
            ssoDomain: domains.first,
            ssoDomainVerification: {
                status: SsoDomainVerificationStatus.VERIFIED,
                record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domains.first}`, value: TXT_VALUE },
                createdAt: new Date().toISOString(),
            },
            federatedAuthProviders: saml ? { saml: SAML } : {},
        },
        plan: { ssoEnabled, multipleEmailDomainsEnabled },
    })
    const firstDomain = await databaseConnection().getRepository('email_domain').findOneByOrFail({ platformId: mockPlatform.id, domain: domains.first })
    const second = await saveDomain({ platformId: mockPlatform.id, domain: domains.second, status: SsoDomainVerificationStatus.VERIFIED })
    const pending = await saveDomain({ platformId: mockPlatform.id, domain: domains.pending, status: SsoDomainVerificationStatus.PENDING_VERIFICATION })
    for (const email of [members.second, members.pending]) {
        await mockBasicUser({
            user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, status: UserStatus.ACTIVE },
            userIdentity: { email, password: PASSWORD, verified: true },
        })
    }
    const token = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })
    return {
        platformId: mockPlatform.id,
        token,
        domains,
        members,
        domainIds: { first: firstDomain.id, second: second.id, pending: pending.id },
    }
}

async function saveDomain({ platformId, domain, status }: SaveDomainParams): Promise<{ id: string }> {
    const id = apId()
    await databaseConnection().getRepository('email_domain').save({ id, platformId, domain, verificationStatus: status, verificationRecordValue: TXT_VALUE })
    return { id }
}

async function tryPassword(email: string): Promise<string> {
    const response = await app.inject({ method: 'POST', url: '/api/v1/authentication/sign-in', body: createMockSignInRequest({ email, password: PASSWORD }) })
    return outcome(response)
}

async function tryPasswordSignUp(email: string): Promise<string> {
    const response = await app.inject({ method: 'POST', url: '/api/v1/authentication/sign-up', body: createMockSignUpRequest({ email, password: PASSWORD }) })
    return outcome(response)
}

async function tryCode(email: string): Promise<string> {
    ipCounter += 1
    const request = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/otp/request',
        headers: { 'x-real-ip': `10.77.${Math.floor(ipCounter / 250)}.${ipCounter % 250}` },
        body: { email },
    })
    if (request.statusCode !== StatusCodes.NO_CONTENT) {
        return outcome(request)
    }
    const identity = await storedIdentity(email)
    if (identity === null) {
        return 'NO_IDENTITY'
    }
    const code = await deliveredCode(identity.id)
    const verify = await app.inject({ method: 'POST', url: '/api/v1/authentication/otp/verify', body: { email, code } })
    return outcome(verify)
}

async function tryGoogle(email: string): Promise<string> {
    googleAccount.email = email
    const response = await app.inject({ method: 'POST', url: '/api/v1/authn/federated/claim', body: { providerName: 'google', code: 'authorization-code' } })
    return outcome(response)
}

async function trySaml({ email, platformId }: { email: string, platformId: string }): Promise<string> {
    try {
        await authenticationService(log).federatedAuthn({
            email,
            firstName: 'test',
            lastName: 'person',
            newsLetter: false,
            trackEvents: false,
            provider: UserIdentityProvider.SAML,
            predefinedPlatformId: platformId,
        })
        return OK
    }
    catch (error) {
        const code = (error as { error?: { code?: string } }).error?.code
        return code ?? 'UNKNOWN_ERROR'
    }
}

function outcome(response: { statusCode: number, json: () => { code?: string } }): string {
    if (response.statusCode < 300) {
        return OK
    }
    return response.json().code ?? `HTTP_${response.statusCode}`
}

function asOwner(setup: TwoDomainPlatform) {
    const headers = { authorization: `Bearer ${setup.token}` }
    return {
        post: (url: string, body?: Record<string, unknown>) => app.inject({ method: 'POST', url, headers, body: body ?? {} }),
        delete: (url: string) => app.inject({ method: 'DELETE', url, headers }),
    }
}

async function samlIsSetUp(platformId: string): Promise<boolean> {
    const platform = await databaseConnection().getRepository('platform').findOneOrFail({ where: { id: platformId }, select: { id: true, federatedAuthProviders: true } })
    return Boolean((platform.federatedAuthProviders as { saml?: unknown } | null)?.saml)
}

async function saveAcceptedInvitation({ email, platformId }: { email: string, platformId: string }): Promise<void> {
    const invitation = createMockUserInvitation({ email, platformId, status: InvitationStatus.ACCEPTED, type: InvitationType.PLATFORM, platformRole: PlatformRole.MEMBER })
    await databaseConnection().getRepository('user_invitation').save(invitation)
}

async function storedIdentity(email: string): Promise<{ id: string } | null> {
    return databaseConnection().getRepository('user_identity').findOneBy({ email })
}

async function deliveredCode(identityId: string): Promise<string | null> {
    const row = await databaseConnection().getRepository('otp').findOneBy({ identityId, type: OtpType.EMAIL_LOGIN })
    if (row === null) {
        return null
    }
    const delivered = await distributedStore.get<string>(`otp-pending-code:${identityId}:${OtpType.EMAIL_LOGIN}`)
    return delivered ?? row.value
}

function uniqueDomain(): string {
    return `${apId().toLowerCase()}.example.com`
}

const PASSWORD = 'correct-horse-battery'
const TXT_VALUE = 'activepieces-verify=test'
const SAML = { idpMetadata: '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"></md:EntityDescriptor>', idpCertificate: 'test-cert' }
const OK = 'OK'
const NOT_ALLOWED = 'SIGN_IN_METHOD_NOT_ALLOWED'
const DOMAIN_NOT_ALLOWED = 'DOMAIN_NOT_ALLOWED'

type MemberKey = 'first' | 'second' | 'pending'

type SaveTwoDomainPlatformParams = {
    emailAuthEnabled: boolean
    googleAuthEnabled: boolean
    saml: boolean
    multipleEmailDomainsEnabled?: boolean
    ssoEnabled?: boolean
}

type SaveDomainParams = {
    platformId: string
    domain: string
    status: SsoDomainVerificationStatus
}

type TwoDomainPlatform = {
    platformId: string
    token: string
    domains: Record<MemberKey, string>
    members: Record<MemberKey, string>
    domainIds: Record<MemberKey, string>
}
