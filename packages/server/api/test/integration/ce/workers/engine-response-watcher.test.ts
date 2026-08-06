import { apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { engineResponseWatcher } from '../../../../src/app/workers/engine-response-watcher'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('engineResponseWatcher.waitForResponse', () => {
    it('should receive a response published while the enqueue callback is still running', async () => {
        const requestId = apId()
        const serverId = engineResponseWatcher(app.log).getServerId()

        const result = await engineResponseWatcher(app.log).waitForResponse<{ ok: boolean } | undefined>({
            requestId,
            timeoutMs: 5000,
            defaultResponse: undefined,
            enqueue: async () => {
                await engineResponseWatcher(app.log).publish(serverId, requestId, { ok: true })
            },
        })

        expect(result).toEqual({ ok: true })
    })

    it('should resolve with the default response when no response arrives before the timeout', async () => {
        const requestId = apId()

        const result = await engineResponseWatcher(app.log).waitForResponse<{ ok: boolean } | undefined>({
            requestId,
            timeoutMs: 100,
            defaultResponse: undefined,
            enqueue: async () => {},
        })

        expect(result).toBeUndefined()
    })

    it('should rethrow and stop waiting when the enqueue callback fails', async () => {
        const requestId = apId()

        await expect(engineResponseWatcher(app.log).waitForResponse<undefined>({
            requestId,
            timeoutMs: 5000,
            defaultResponse: undefined,
            enqueue: async () => {
                throw new Error('enqueue failed')
            },
        })).rejects.toThrow('enqueue failed')
    })
})
