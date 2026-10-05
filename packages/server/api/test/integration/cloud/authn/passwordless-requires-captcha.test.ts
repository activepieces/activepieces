import { ApFlagId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    delete process.env.AP_TURNSTILE_SITE_KEY
    delete process.env.AP_TURNSTILE_SECRET_KEY
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('signing in with an emailed code when no captcha is configured', () => {
    it.each([
        ['/api/v1/authentication/otp/request', { email: 'someone@example.com' }],
        ['/api/v1/authentication/otp/verify', { email: 'someone@example.com', code: '424242' }],
    ])('does not serve %s', async (url, body) => {
        const response = await app?.inject({ method: 'POST', url, body })

        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('still serves /complete-sign-up, which finishes any onboarding session', async () => {
        const response = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/complete-sign-up',
            body: { fullName: 'Someone Else' },
        })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('leaves the rest of the instance running', async () => {
        const signIn = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-in',
            body: { email: 'nobody@example.com', password: 'whatever-123' },
        })
        const flags = await app?.inject({ method: 'GET', url: '/api/v1/flags' })

        expect(signIn?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        expect(flags?.statusCode).toBe(StatusCodes.OK)
        expect(flags?.json()[ApFlagId.EMAIL_CODE_AUTH_ENABLED]).toBe(false)
    })
})
