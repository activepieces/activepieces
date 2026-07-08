import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
})

describe('AI Tools API edition gating', () => {
    it('should not register the ai-tools routes in the community edition', async () => {
        const response = await ctx.get('/v1/ai-tools')

        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})
