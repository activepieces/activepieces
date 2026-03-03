import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flags API', () => {
    describe('GET /v1/flags', () => {
        it('should return flags with expected keys and value types', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flags',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            expect(body).toHaveProperty('ENVIRONMENT')
            expect(typeof body.ENVIRONMENT).toBe('string')
            expect(body).toHaveProperty('WEBHOOK_URL_PREFIX')
            expect(typeof body.WEBHOOK_URL_PREFIX).toBe('string')
        })
    })
})
