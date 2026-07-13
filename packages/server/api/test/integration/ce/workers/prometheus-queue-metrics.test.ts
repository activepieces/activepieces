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

describe('Prometheus Queue Metrics API (community edition)', () => {
    describe('GET /v1/worker-machines/queue-metrics/prometheus/:queueName?', () => {
        it('returns Prometheus text format for the default shared queue', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/worker-machines/queue-metrics/prometheus')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.headers['content-type']).toContain('text/plain')
            expect(response?.body).toContain('bullmq')
        })

        it('rejects unauthenticated requests', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/worker-machines/queue-metrics/prometheus',
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
