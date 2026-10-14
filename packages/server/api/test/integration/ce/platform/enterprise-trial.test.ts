import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Enterprise trial API', () => {
    it('does not exist on Community', async () => {
        const ctx = await createTestContext(app!)

        const status = await ctx.get('/v1/platform-billing/enterprise-trial')
        const start = await ctx.post('/v1/platform-billing/enterprise-trial/start')

        expect(status.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(start.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})
