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
        ['/api/v1/authentication/complete-sign-up', { fullName: 'Someone Else' }],
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

        expect(response?.statusCode).not.toBe(StatusCodes.NOT_FOUND)
    })
})
