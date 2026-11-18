import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Last sign-in method guard on CE', () => {
    it('allows turning email off, because CE always counts email as working', async () => {
        const ctx = await createTestContext(app, { platform: { emailAuthEnabled: true, googleAuthEnabled: false } })

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { emailAuthEnabled: false })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })
})
