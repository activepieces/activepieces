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

describe('Self-serve trial API', () => {
    it('has no trial start on Community', async () => {
        const ctx = await createTestContext(app!)

        const start = await ctx.post('/v1/platform-billing/self-serve-trial/start')

        expect(start.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})
