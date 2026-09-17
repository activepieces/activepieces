import { ApFlagId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    process.env.AP_TURNSTILE_SITE_KEY = 'test-site-key'
    process.env.AP_TURNSTILE_SECRET_KEY = 'test-secret-key'
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('signing in with an emailed code on an enterprise instance', () => {
    it.each([
        ['/api/v1/authentication/otp/request', { email: 'someone@example.com' }],
        ['/api/v1/authentication/otp/verify', { email: 'someone@example.com', code: '424242' }],
    ])('does not serve %s, even with a captcha configured', async (url, body) => {
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

    it('tells the frontend the code flow is off', async () => {
        const response = await app?.inject({ method: 'GET', url: '/api/v1/flags' })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json()[ApFlagId.EMAIL_CODE_AUTH_ENABLED]).toBe(false)
    })
})
