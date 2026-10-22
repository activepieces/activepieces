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
    it('keeps a waiter with a short retry delay waiting until the holder releases', async () => {
        const key = `distributed-lock-test:${apId()}`
        const holderHasTheLock = Promise.withResolvers<undefined>()
        const releaseTheHolder = Promise.withResolvers<undefined>()
        const order: string[] = []
        const holder = distributedLock(app.log).runExclusive({
            key,
            timeoutInSeconds: 3,
            fn: async () => {
                holderHasTheLock.resolve(undefined)
                await releaseTheHolder.promise
                order.push('holder')
            },
        })
        await holderHasTheLock.promise

        const waiter = distributedLock(app.log).runExclusive({
            key,
            timeoutInSeconds: 3,
            retryDelayMs: 25,
            retryJitterMs: 0,
            fn: async () => {
                order.push('waiter')
            },
        })
        const outcomes = Promise.allSettled([holder, waiter])
        await new Promise((resolve) => setTimeout(resolve, HOLD_MS))
        releaseTheHolder.resolve(undefined)

        expect((await outcomes).map((outcome) => outcome.status)).toEqual(['fulfilled', 'fulfilled'])
        expect(order).toEqual(['holder', 'waiter'])
    })
})

const HOLD_MS = 1500
