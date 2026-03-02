import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { FastifyInstance } from 'fastify'
import { createTestContext } from '../../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('List flow runs endpoint', () => {
    it('should return empty list with correct structure', async () => {
        const ctx = await createTestContext(app!)

        const response = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.data).toEqual([])
        expect(body.cursor).toBeUndefined()
    })
})
