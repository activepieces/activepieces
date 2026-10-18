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

describe('platform update on Community', () => {
    it('saves branding and embed origins without checking the plan', async () => {
        const ctx = await createTestContext(app!)

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, {
            primaryColor: '#ff0000',
            allowedEmbedOrigins: ['https://example.com'],
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })
})
