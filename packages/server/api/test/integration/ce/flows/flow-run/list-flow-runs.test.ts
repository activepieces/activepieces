import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { FastifyInstance } from 'fastify'
import { describeWithAuth } from '../../../../helpers/describe-with-auth'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describeWithAuth('List flow runs endpoint', () => app!, (setup) => {
    it('should return empty list with correct structure', async () => {
        const ctx = await setup()

        const response = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.data).toEqual([])
        expect(body.cursor).toBeUndefined()
    })
})
