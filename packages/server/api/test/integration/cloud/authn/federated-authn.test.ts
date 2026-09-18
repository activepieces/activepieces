import { safeHttp } from '@activepieces/server-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { redisConnections } from '../../../../src/app/database/redis-connections'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const FRESH_TENANT_EMAIL = 'user01@fresh-tenant.example'
const DISPOSABLE_DOMAIN_CACHE_KEY = 'zerobounce:disposable-domains:v1'

const googleAccount = vi.hoisted(() => ({
    email: 'user01@fresh-tenant.example',
    firstName: 'user',
    lastName: '01',
}))

vi.mock('../../../../src/app/ee/authentication/federated-authn/google-authn-provider', () => ({
    googleAuthnProvider: () => ({
        getLoginUrl: () => Promise.resolve('https://accounts.google.com/o/oauth2/v2/auth'),
        authenticate: () => Promise.resolve(googleAccount),
    }),
}))

let app: FastifyInstance | null = null

function answersAboutTheAddress(verdict: { status: string, sub_status: string }) {
    const realGet = safeHttp.axios.get.bind(safeHttp.axios)
    return vi.spyOn(safeHttp.axios, 'get').mockImplementation((url, config) => {
        if (String(url).includes('zerobounce')) {
            return Promise.resolve({ data: verdict })
        }
        return realGet(url, config)
    })
}

async function claimWithGoogle() {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/authn/federated/claim',
        body: {
            providerName: 'google',
            code: 'authorization-code',
        },
    })
}

async function storedIdentity() {
    return databaseConnection().getRepository('user_identity').findOneBy({ email: googleAccount.email })
}

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    process.env.AP_ZEROBOUNCE_API_KEY = 'test-api-key'
    googleAccount.email = FRESH_TENANT_EMAIL
    const redis = await redisConnections.useExisting()
    await redis.del(DISPOSABLE_DOMAIN_CACHE_KEY)
    await mockAndSaveBasicSetup()
})

afterEach(() => {
    delete process.env.AP_GOOGLE_CLIENT_ID
    delete process.env.AP_GOOGLE_CLIENT_SECRET
    delete process.env.AP_ZEROBOUNCE_API_KEY
    vi.restoreAllMocks()
})

describe('Federated Authentication API', () => {
    describe('Claim Endpoint', () => {
        it('refuses a Google sign-up whose domain cannot receive mail, says so, and creates nothing', async () => {
            const answer = answersAboutTheAddress({ status: 'invalid', sub_status: 'no_dns_entries' })

            const response = await claimWithGoogle()

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()).toEqual({
                code: 'DOMAIN_NOT_ALLOWED',
                params: { domain: 'fresh-tenant.example' },
            })
            expect(answer).toHaveBeenCalledTimes(1)
            expect(await storedIdentity()).toBeNull()
        })

        it('refuses a disposable Google address the same way the sign-up form does, and remembers the domain', async () => {
            googleAccount.email = 'user01@throwaway.example'
            const answer = answersAboutTheAddress({ status: 'do_not_mail', sub_status: 'disposable' })

            const response = await claimWithGoogle()

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()?.code).toBe('DOMAIN_NOT_ALLOWED')
            expect(await storedIdentity()).toBeNull()

            answer.mockClear()
            googleAccount.email = 'user02@throwaway.example'
            const secondResponse = await claimWithGoogle()

            expect(secondResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(answer).not.toHaveBeenCalled()
        })

        it('asks ZeroBounce once for a new Google address, lets a valid one in verified, and never asks again for that account', async () => {
            const answer = answersAboutTheAddress({ status: 'valid', sub_status: '' })

            const signUp = await claimWithGoogle()

            expect(signUp?.statusCode).toBe(StatusCodes.OK)
            expect(answer).toHaveBeenCalledTimes(1)
            const identity = await storedIdentity()
            expect(identity?.verified).toBe(true)
            expect(identity?.provider).toBe('GOOGLE')

            answer.mockClear()
            const signIn = await claimWithGoogle()

            expect(signIn?.statusCode).toBe(StatusCodes.OK)
            expect(answer).not.toHaveBeenCalled()
        })
    })
})
