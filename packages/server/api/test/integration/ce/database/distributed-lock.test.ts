import { apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { distributedLock } from '../../../../src/app/database/redis-connections'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('distributedLock', () => {
    it('keeps a waiter with a short retry delay waiting for the whole timeout', async () => {
        const key = `distributed-lock-test:${apId()}`
        const holder = distributedLock(app.log).runExclusive({
            key,
            timeoutInSeconds: 3,
            fn: () => new Promise((resolve) => setTimeout(resolve, 1500)),
        })
        await new Promise((resolve) => setTimeout(resolve, 50))
        const waitStartedAt = Date.now()

        const waitedMs = await distributedLock(app.log).runExclusive({
            key,
            timeoutInSeconds: 3,
            retryDelayMs: 25,
            retryJitterMs: 0,
            fn: async () => Date.now() - waitStartedAt,
        })
        await holder

        expect(waitedMs).toBeGreaterThanOrEqual(1300)
    })
})
