import { apId } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, OtpType, PlatformRole, SsoDomainVerificationRecordType, SsoDomainVerificationStatus, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { authenticationService } from '../../../../src/app/authentication/authentication.service'
import { turnstile } from '../../../../src/app/authentication/lib/turnstile'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { decodeToken } from '../../../helpers/auth'
import { createMockUser, createMockUserInvitation, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { createMockSignInRequest, createMockSignUpRequest } from '../../../helpers/mocks/authn'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

process.env.AP_TURNSTILE_SITE_KEY = 'test-site-key'
process.env.AP_TURNSTILE_SECRET_KEY = 'test-secret-key'

const PASSWORD = 'correct-horse-battery'

const googleAccount = vi.hoisted(() => ({
    email: '',
    firstName: 'maya',
    lastName: 'acme',
}))

vi.mock('../../../../src/app/ee/authentication/federated-authn/google-authn-provider', () => ({
    googleAuthnProvider: () => ({
        getLoginUrl: () => Promise.resolve('https://accounts.google.com/o/oauth2/v2/auth'),
        authenticate: () => Promise.resolve(googleAccount),
    }),
}))

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

beforeEach(() => {
    process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
})

afterEach(() => {
    delete process.env.AP_GOOGLE_CLIENT_ID
    delete process.env.AP_GOOGLE_CLIENT_SECRET
})

describe('Sign-in method enforcement for governed people', () => {
    it('refuses a governed member\'s password sign-in with the platform name and the allowed methods', async () => {
        const { mockPlatform, mockUserIdentity } = await saveGoverningPlatform({ emailAuthEnabled: false, googleAuthEnabled: true })

        const response = await signInWithPassword({ email: mockUserIdentity.email, password: PASSWORD })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(response?.json()).toMatchObject({
            code: 'SIGN_IN_METHOD_NOT_ALLOWED',
            params: { platformName: mockPlatform.name, allowedMethods: ['GOOGLE'] },
        })
    })

    it('answers a wrong password as invalid credentials, never with the governing platform\'s rules', async () => {
        const { mockUserIdentity } = await saveGoverningPlatform({ emailAuthEnabled: false, googleAuthEnabled: true })

        const response = await signInWithPassword({ email: mockUserIdentity.email, password: 'wrong-password' })

        expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        expect(response?.json()?.code).toBe('INVALID_CREDENTIALS')
    })

    it('refuses an accepted invitee\'s password sign-up before any account is created, without naming the platform or its methods', async () => {
        const { mockPlatform, domain } = await saveGoverningPlatform({ emailAuthEnabled: false, googleAuthEnabled: true })
        const email = `priya@${domain}`
        await saveAcceptedInvitation({ email, platformId: mockPlatform.id })

        const response = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-up',
            body: createMockSignUpRequest({ email, password: PASSWORD }),
        })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(response?.json()?.code).toBe('SIGN_IN_METHOD_NOT_ALLOWED')
        expect(response?.json()?.params).toEqual({})
        expect(await storedIdentity(email)).toBeNull()
    })

    it('sends the emailed code and refuses it only once it is entered', async () => {
        const { mockUserIdentity } = await saveGoverningPlatform({ emailAuthEnabled: false, googleAuthEnabled: true })

        const request = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/otp/request',
            headers: { 'x-real-ip': '10.9.0.1' },
            body: { email: mockUserIdentity.email },
        })
        expect(request?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const code = await deliveredCode(mockUserIdentity.id)
        expect(code).not.toBeNull()

        const verify = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/otp/verify',
            body: { email: mockUserIdentity.email, code },
        })

        expect(verify?.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(verify?.json()?.code).toBe('SIGN_IN_METHOD_NOT_ALLOWED')
    })

    it('refuses a governed member\'s Google sign-in on the server', async () => {
        const { mockUserIdentity } = await saveGoverningPlatform({ emailAuthEnabled: true, googleAuthEnabled: false })
        googleAccount.email = mockUserIdentity.email

        const response = await claimWithGoogle()

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(response?.json()).toMatchObject({
            code: 'SIGN_IN_METHOD_NOT_ALLOWED',
            params: { allowedMethods: ['EMAIL'] },
        })
    })

    it('refuses an accepted invitee\'s first Google sign-in before any account is created', async () => {
        const { mockPlatform, domain } = await saveGoverningPlatform({ emailAuthEnabled: true, googleAuthEnabled: false })
        const email = `priya@${domain}`
        await saveAcceptedInvitation({ email, platformId: mockPlatform.id })
        googleAccount.email = email

        const response = await claimWithGoogle()

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(response?.json()?.code).toBe('SIGN_IN_METHOD_NOT_ALLOWED')
        expect(await storedIdentity(email)).toBeNull()
    })

    it('guest keeps every method', async () => {
        const { mockPlatform } = await saveGoverningPlatform({ emailAuthEnabled: true, googleAuthEnabled: false })
        const { mockUserIdentity } = await mockBasicUser({
            user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, status: UserStatus.ACTIVE },
            userIdentity: { email: `leo@${uniqueDomain()}`, verified: true },
        })
        googleAccount.email = mockUserIdentity.email

        const response = await claimWithGoogle()

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json()?.platformId).toBe(mockPlatform.id)
    })

    it('governed sign-in lands on the governing platform', async () => {
        const { mockPlatform: governing, mockUserIdentity } = await saveGoverningPlatform({ emailAuthEnabled: true, googleAuthEnabled: true })
        const { mockPlatform: lastUsed } = await mockAndSaveBasicSetup()
        await addMembership({ identityId: mockUserIdentity.id, platformId: lastUsed.id })
        await databaseConnection().getRepository('user_identity').update(mockUserIdentity.id, { lastLoggedInPlatformId: lastUsed.id })

        const response = await signInWithPassword({ email: mockUserIdentity.email, password: PASSWORD })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(decodeToken(response?.json()?.token)?.platform?.id).toBe(governing.id)
    })

    it('refuses a governed member\'s single sign-on through another platform\'s identity provider', async () => {
        const { mockUserIdentity } = await saveGoverningPlatform({ emailAuthEnabled: true, googleAuthEnabled: true })
        const { mockPlatform: otherPlatform } = await mockAndSaveBasicSetup()

        await expect(authenticationService(mockLog).federatedAuthn({
            email: mockUserIdentity.email,
            firstName: 'maya',
            lastName: 'acme',
            newsLetter: false,
            trackEvents: false,
            provider: UserIdentityProvider.SAML,
            predefinedPlatformId: otherPlatform.id,
        })).rejects.toHaveProperty('error', { code: 'SIGN_IN_METHOD_NOT_ALLOWED', params: {} })
    })

    it('refuses an accepted invitee\'s first single sign-on through another platform\'s identity provider without naming the platform or its methods', async () => {
        const { mockPlatform, domain } = await saveGoverningPlatform({ emailAuthEnabled: true, googleAuthEnabled: true })
        const email = `priya@${domain}`
        await saveAcceptedInvitation({ email, platformId: mockPlatform.id })
        const { mockPlatform: otherPlatform } = await mockAndSaveBasicSetup()

        await expect(authenticationService(mockLog).federatedAuthn({
            email,
            firstName: 'priya',
            lastName: 'acme',
            newsLetter: false,
            trackEvents: false,
            provider: UserIdentityProvider.SAML,
            predefinedPlatformId: otherPlatform.id,
        })).rejects.toHaveProperty('error', { code: 'SIGN_IN_METHOD_NOT_ALLOWED', params: {} })
        expect(await storedIdentity(email)).toBeNull()
    })

    it('answers a governed member\'s single sign-on through a platform verified for another domain as a domain mismatch', async () => {
        const { mockUserIdentity } = await saveGoverningPlatform({ emailAuthEnabled: true, googleAuthEnabled: true })
        const { mockPlatform: otherPlatform } = await saveGoverningPlatform({ emailAuthEnabled: true, googleAuthEnabled: true })

        await expect(authenticationService(mockLog).federatedAuthn({
            email: mockUserIdentity.email,
            firstName: 'maya',
            lastName: 'acme',
            newsLetter: false,
            trackEvents: false,
            provider: UserIdentityProvider.SAML,
            predefinedPlatformId: otherPlatform.id,
        })).rejects.toMatchObject({ error: { code: 'DOMAIN_NOT_ALLOWED' } })
    })
})

async function signInWithPassword({ email, password }: SignInWithPasswordParams) {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/authentication/sign-in',
        body: createMockSignInRequest({ email, password }),
    })
}

async function claimWithGoogle() {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/authn/federated/claim',
        body: { providerName: 'google', code: 'authorization-code' },
    })
}

async function saveGoverningPlatform({ emailAuthEnabled, googleAuthEnabled }: SaveGoverningPlatformParams) {
    const domain = uniqueDomain()
    const setup = await mockAndSaveBasicSetup({
        userIdentity: { email: `maya@${domain}`, password: PASSWORD },
        platform: {
            emailAuthEnabled,
            googleAuthEnabled,
            ssoDomain: domain,
            ssoDomainVerification: {
                status: SsoDomainVerificationStatus.VERIFIED,
                record: { type: SsoDomainVerificationRecordType.TXT, name: `_activepieces-verify.${domain}`, value: 'activepieces-verify=test' },
                createdAt: new Date().toISOString(),
            },
        },
        plan: { ssoEnabled: true },
    })
    return { ...setup, domain }
}

async function saveAcceptedInvitation({ email, platformId }: SaveAcceptedInvitationParams): Promise<void> {
    const invitation = createMockUserInvitation({ email, platformId, status: InvitationStatus.ACCEPTED, type: InvitationType.PLATFORM, platformRole: PlatformRole.MEMBER })
    await databaseConnection().getRepository('user_invitation').save(invitation)
}

async function addMembership({ identityId, platformId }: AddMembershipParams): Promise<void> {
    const user = createMockUser({ identityId, platformId, platformRole: PlatformRole.MEMBER, status: UserStatus.ACTIVE })
    await databaseConnection().getRepository('user').save(user)
}

async function storedIdentity(email: string) {
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

type SignInWithPasswordParams = {
    email: string
    password: string
}

type SaveGoverningPlatformParams = {
    emailAuthEnabled: boolean
    googleAuthEnabled: boolean
}

type AddMembershipParams = {
    identityId: string
    platformId: string
}

type SaveAcceptedInvitationParams = {
    email: string
    platformId: string
}
