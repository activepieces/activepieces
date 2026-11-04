import { ApplicationEvent, ApplicationEventName, OtpType, PlatformRole, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { turnstile } from '../../../../src/app/authentication/lib/turnstile'
import { userIdentityService } from '../../../../src/app/authentication/user-identity/user-identity-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { auditLogRepo } from '../../../../src/app/ee/audit-logs/audit-event-service'
import { generateMockExternalToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockProject, createMockSigningKey, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

process.env.AP_TURNSTILE_SITE_KEY = 'test-site-key'
process.env.AP_TURNSTILE_SECRET_KEY = 'test-secret-key'

const googleAccount = vi.hoisted(() => ({
    email: '',
    firstName: 'Sam',
    lastName: 'Lee',
}))

vi.mock('../../../../src/app/ee/authentication/federated-authn/google-authn-provider', () => ({
    googleAuthnProvider: () => ({
        getLoginUrl: () => Promise.resolve('https://accounts.google.com/o/oauth2/v2/auth'),
        authenticate: () => Promise.resolve(googleAccount),
    }),
}))

let app: FastifyInstance | null = null
let callers = 0

beforeAll(async () => {
    vi.spyOn(turnstile, 'assertSolved').mockResolvedValue(undefined)
    app = await setupTestEnvironment()
    process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
})

afterAll(async () => {
    delete process.env.AP_GOOGLE_CLIENT_ID
    delete process.env.AP_GOOGLE_CLIENT_SECRET
    await teardownTestEnvironment()
})

describe('Sign-in audit events', () => {
    it('records a password sign-in with its method', async () => {
        const { platformId, email, password } = await createMember()

        const response = await app?.inject({ method: 'POST', url: '/api/v1/authentication/sign-in', body: { email, password } })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(await settledEvents({ platformId, expectedCount: 1 })).toEqual([signInEvent({ email, method: UserIdentityProvider.EMAIL })])
    })

    it('records an emailed-code sign-in with its method', async () => {
        const { platformId, email } = await createMember()

        const response = await signInWithCode(email)

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(await settledEvents({ platformId, expectedCount: 1 })).toEqual([signInEvent({ email, method: UserIdentityProvider.EMAIL })])
    })

    it('records a returning Google sign-in', async () => {
        const { platformId, email } = await createMember()
        googleAccount.email = email

        const response = await claimWithGoogle()

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(await settledEvents({ platformId, expectedCount: 1 })).toEqual([signInEvent({ email, method: UserIdentityProvider.GOOGLE })])
    })

    describe('records a first sign-in as signed up only, with the method', () => {
        it('for Google', async () => {
            googleAccount.email = faker.internet.email().toLowerCase()

            const response = await claimWithGoogle()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const events = await settledEvents({ platformId: response?.json().platformId, expectedCount: 1 })
            expect(events).toEqual([signUpEvent({ email: googleAccount.email, method: UserIdentityProvider.GOOGLE, source: 'sso' })])
        })

        it('for an emailed code from someone whose name we already have', async () => {
            const email = faker.internet.email().toLowerCase()
            await createIdentity({ email, password: 'password' })

            const response = await signInWithCode(email)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const events = await settledEvents({ platformId: response?.json().platformId, expectedCount: 1 })
            expect(events).toEqual([signUpEvent({ email, method: UserIdentityProvider.EMAIL, source: 'credentials' })])
        })

        it('for the first password sign-in after verifying the email', async () => {
            const email = faker.internet.email().toLowerCase()
            await createIdentity({ email, password: 'password' })

            const response = await app?.inject({ method: 'POST', url: '/api/v1/authentication/sign-in', body: { email, password: 'password' } })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const events = await settledEvents({ platformId: response?.json().platformId, expectedCount: 1 })
            expect(events).toEqual([signUpEvent({ email, method: UserIdentityProvider.EMAIL, source: 'credentials' })])
        })
    })

    it('records the method when sign-up finishes at the name step', async () => {
        const email = faker.internet.email().toLowerCase()
        const onboarding = await signInWithCode(email)
        expect(onboarding?.json().platformId).toBeNull()

        const response = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/complete-sign-up',
            headers: { authorization: `Bearer ${onboarding?.json().token}` },
            body: { fullName: 'Dana Levi' },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const events = await settledEvents({ platformId: response?.json().platformId, expectedCount: 1 })
        expect(events).toEqual([signUpEvent({ email, method: UserIdentityProvider.EMAIL, source: 'credentials' })])
    })

    it('records an embed sign-up only when the member is created', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()
        const signingKey = createMockSigningKey({ platformId: mockPlatform.id })
        await db.save('signing_key', signingKey)
        const { mockExternalToken } = generateMockExternalToken({ platformId: mockPlatform.id, signingKeyId: signingKey.id })
        const exchange = async () => app?.inject({
            method: 'POST',
            url: '/api/v1/managed-authn/external-token',
            body: { externalAccessToken: mockExternalToken },
        })

        const first = await exchange()
        const second = await exchange()

        expect(first?.statusCode).toBe(StatusCodes.OK)
        expect(second?.statusCode).toBe(StatusCodes.OK)
        const events = await settledEvents({ platformId: mockPlatform.id, expectedCount: 1 })
        expect(events).toEqual([expect.objectContaining({
            action: ApplicationEventName.USER_SIGNED_UP,
            userId: first?.json().id,
            data: expect.objectContaining({ method: UserIdentityProvider.JWT, source: 'managed' }),
        })])
    })
})

async function createMember(): Promise<{ platformId: string, email: string, password: string }> {
    const email = faker.internet.email().toLowerCase()
    const password = 'password'
    const { mockPlatform } = await mockAndSaveBasicSetup({ platform: { emailAuthEnabled: true, enforceAllowedAuthDomains: false } })
    const { mockUser } = await mockBasicUser({
        user: { status: UserStatus.ACTIVE, platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER },
        userIdentity: { email, password, verified: true, firstName: 'Priya', lastName: 'Shah' },
    })
    await db.save('user', mockUser)
    await db.save('project', createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id }))
    return { platformId: mockPlatform.id, email, password }
}

async function createIdentity({ email, password }: { email: string, password: string }): Promise<void> {
    await userIdentityService(app!.log).create({
        email,
        password,
        firstName: 'Omar',
        lastName: 'Haddad',
        trackEvents: false,
        newsLetter: false,
        provider: UserIdentityProvider.EMAIL,
        verified: true,
    })
}

async function signInWithCode(email: string) {
    callers += 1
    await app?.inject({
        method: 'POST',
        url: '/api/v1/authentication/otp/request',
        headers: { 'x-real-ip': `10.1.${Math.floor(callers / 256)}.${callers % 256}` },
        body: { email },
    })
    const identity = await databaseConnection().getRepository('user_identity').findOneByOrFail({ email })
    const code = await distributedStore.get<string>(`otp-pending-code:${identity.id}:${OtpType.EMAIL_LOGIN}`)
    return app?.inject({ method: 'POST', url: '/api/v1/authentication/otp/verify', body: { email, code } })
}

async function claimWithGoogle() {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/authn/federated/claim',
        body: { providerName: 'google', code: 'authorization-code' },
    })
}

async function settledEvents({ platformId, expectedCount }: { platformId: string, expectedCount: number }): Promise<ApplicationEvent[]> {
    const find = async (): Promise<ApplicationEvent[]> => auditLogRepo().find({ where: { platformId }, order: { created: 'ASC' } })
    await vi.waitUntil(async () => (await find()).length >= expectedCount, { timeout: 5000, interval: 50 })
    await new Promise((resolve) => setTimeout(resolve, 300))
    return find()
}

function signInEvent({ email, method }: { email: string, method: UserIdentityProvider }): unknown {
    return expect.objectContaining({
        action: ApplicationEventName.USER_SIGNED_IN,
        userEmail: email,
        data: expect.objectContaining({ method }),
    })
}

function signUpEvent({ email, method, source }: { email: string, method: UserIdentityProvider, source: string }): unknown {
    return expect.objectContaining({
        action: ApplicationEventName.USER_SIGNED_UP,
        userEmail: email,
        data: expect.objectContaining({ method, source }),
    })
}
