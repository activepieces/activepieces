import { ApFlagId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('signing in with an emailed code on a self-hosted instance', () => {
    it.each([
        ['/api/v1/authentication/otp/request', { email: 'someone@example.com' }],
        ['/api/v1/authentication/otp/verify', { email: 'someone@example.com', code: '424242' }],
    ])('does not serve %s', async (url, body) => {
        const response = await app?.inject({ method: 'POST', url, body })

        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('still serves the password routes it replaced', async () => {
        const response = await app?.inject({
            method: 'POST',
            url: '/api/v1/authentication/sign-in',
            body: { email: 'nobody@example.com', password: 'whatever-123' },
        })

        expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
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
