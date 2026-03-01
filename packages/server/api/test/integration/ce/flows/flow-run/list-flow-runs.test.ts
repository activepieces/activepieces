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
    it('should return 200', async () => {
        // arrange
        const ctx = await createTestContext(app!)

        // act
        const response = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
        })

        // assert
        expect(response?.statusCode).toBe(200)
    })
})
