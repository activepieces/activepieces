import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    process.env.AP_QUEUE_UI_ENABLED = 'true'
    process.env.AP_QUEUE_UI_USERNAME = 'testuser'
    process.env.AP_QUEUE_UI_PASSWORD = 'testpass'
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    delete process.env.AP_QUEUE_UI_ENABLED
    delete process.env.AP_QUEUE_UI_USERNAME
    delete process.env.AP_QUEUE_UI_PASSWORD
    await teardownTestEnvironment()
})

function basicHeader(username: string, password: string): string {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

describe('BullBoard Queue UI auth', () => {
    it('rejects unauthenticated requests to /api/ui with 401', async () => {
        const response = await app!.inject({ method: 'GET', url: '/api/ui' })
        expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    })

    it('rejects wrong credentials with 401', async () => {
        const response = await app!.inject({
            method: 'GET',
            url: '/api/ui',
            headers: { authorization: basicHeader('testuser', 'wrongpass') },
        })
        expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    })

    it('allows correct credentials', async () => {
        const response = await app!.inject({
            method: 'GET',
            url: '/api/ui',
            headers: { authorization: basicHeader('testuser', 'testpass') },
        })
        expect(response.statusCode).toBe(StatusCodes.OK)
    })
})
