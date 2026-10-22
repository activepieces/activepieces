import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { healthStatusService } from '../../../../src/app/health/health.service'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
const PROBE_TIMEOUT_MS = 5_000

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('GET /v1/health while the database does not answer', () => {
    it('answers 503 Unhealthy within the probe timeout, then 200 once the database answers again', async () => {
        await healthStatusService(app!.log).markWorkerHealthy()
        const before = await app!.inject({ method: 'GET', url: '/api/v1/health' })
        expect(before.statusCode).toBe(StatusCodes.OK)

        vi.spyOn(databaseConnection(), 'query').mockImplementationOnce(() => new Promise(() => undefined))
        const stalledAt = Date.now()
        const stalled = await app!.inject({ method: 'GET', url: '/api/v1/health' })
        expect(Date.now() - stalledAt).toBeLessThan(PROBE_TIMEOUT_MS)
        expect(stalled.statusCode).toBe(StatusCodes.SERVICE_UNAVAILABLE)
        expect(stalled.json()).toEqual({ status: 'Unhealthy' })

        const after = await app!.inject({ method: 'GET', url: '/api/v1/health' })
        expect(after.statusCode).toBe(StatusCodes.OK)
    }, PROBE_TIMEOUT_MS * 2)
})
