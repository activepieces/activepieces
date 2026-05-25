/**
 * Experiment: stable-engine-response-server-id — APP vs WORKER pub/sub
 *
 * Retain B side: delete each BEGIN/END "A side" section in this file.
 * Retain A side: delete each BEGIN/END "B side" section in this file.
 */
import { StatusCodes } from 'http-status-codes'
import { FastifyBaseLogger } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const channelListeners = new Map<string, (message: string) => void>()
const getEngineResponseServerIdMock = vi.fn()

vi.mock('@api/helper/pubsub', () => ({
    pubsub: {
        subscribe: vi.fn(async (channel: string, listener: (message: string) => void) => {
            channelListeners.set(channel, listener)
        }),
        publish: vi.fn(async (channel: string, message: string) => {
            channelListeners.get(channel)?.(message)
        }),
        unsubscribe: vi.fn(async (channel: string) => {
            channelListeners.delete(channel)
        }),
        close: vi.fn(async () => {
            channelListeners.clear()
        }),
    },
}))

vi.mock('@api/workers/engine-response-server-id', () => ({
    getEngineResponseServerId: () => getEngineResponseServerIdMock(),
}))

import { engineResponseWatcher } from '@api/workers/engine-response-watcher'

const mockLog = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    child: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

function syncWebhookTimeoutResponse() {
    return {
        status: StatusCodes.NO_CONTENT,
        body: {},
        headers: {},
    }
}

function syncWebhookSuccessResponse() {
    return {
        status: StatusCodes.OK,
        body: { ok: true },
        headers: { 'x-test': 'sync' },
    }
}

describe('engineResponseWatcher sync pub/sub (APP vs WORKER)', () => {
    beforeEach(() => {
        channelListeners.clear()
        getEngineResponseServerIdMock.mockClear()
    })

    afterEach(() => {
        channelListeners.clear()
    })

    // BEGIN stable-engine-response-server-id A side (delete this section if experiment retains B side)
    describe('A side — mismatched per-process channels', () => {
        it('should time out when WORKER publishes to its own channel while APP listens on another', async () => {
            const appServerId = 'appRandomServerId0001'
            const workerServerId = 'workerRandomServerI001'
            const webhookRequestId = 'webhook-request-a-side'

            expect(appServerId, 'reproduce bug only when APP and WORKER channels differ').not.toBe(workerServerId)

            getEngineResponseServerIdMock.mockReturnValue(appServerId)
            const appWatcher = engineResponseWatcher(mockLog)
            await appWatcher.init()

            const listenerPromise = appWatcher.oneTimeListener(
                webhookRequestId,
                true,
                200,
                syncWebhookTimeoutResponse(),
            )

            getEngineResponseServerIdMock.mockReturnValue(workerServerId)
            const workerWatcher = engineResponseWatcher(mockLog)
            await workerWatcher.publish(workerServerId, webhookRequestId, syncWebhookSuccessResponse())

            const result = await listenerPromise

            expect(result, 'sync webhook should fall back to 204 when pub/sub channel does not match APP subscription').toEqual(syncWebhookTimeoutResponse())
            expect(result.status, 'timed-out sync webhook must return 204 No Content').toBe(StatusCodes.NO_CONTENT)

            await appWatcher.shutdown()
        })

        it('should not deliver worker success payload when workerHandlerId channel differs from APP subscription', async () => {
            const appServerId = 'appRandomServerId0002'
            const workerServerId = 'workerRandomServerI002'
            const webhookRequestId = 'webhook-request-mismatch'

            getEngineResponseServerIdMock.mockReturnValue(appServerId)
            const appWatcher = engineResponseWatcher(mockLog)
            await appWatcher.init()

            const workerHandlerIdPassedToJob = appServerId
            const buggyWorkerPublishChannel = workerServerId

            expect(workerHandlerIdPassedToJob, 'APP enqueues with its local server id').toBe(appServerId)
            expect(buggyWorkerPublishChannel, 'WORKER publishes to its own local server id').not.toBe(workerHandlerIdPassedToJob)

            const listenerPromise = appWatcher.oneTimeListener(
                webhookRequestId,
                true,
                200,
                syncWebhookTimeoutResponse(),
            )

            getEngineResponseServerIdMock.mockReturnValue(workerServerId)
            const workerWatcher = engineResponseWatcher(mockLog)
            await workerWatcher.publish(buggyWorkerPublishChannel, webhookRequestId, syncWebhookSuccessResponse())

            const result = await listenerPromise

            expect(result.body, 'response body must stay empty after channel mismatch timeout').toEqual({})
            expect(result, 'listener must not observe worker success payload on wrong channel').not.toEqual({
                ...syncWebhookSuccessResponse(),
                status: StatusCodes.OK,
            })

            await appWatcher.shutdown()
        })
    })
    // END stable-engine-response-server-id A side

    // BEGIN stable-engine-response-server-id B side (delete this section if experiment retains A side)
    describe('B side — shared stable channel', () => {
        it('should deliver sync webhook response when WORKER publishes to the shared stable channel', async () => {
            const sharedServerId = 'StableSharedServerId0'
            const webhookRequestId = 'webhook-request-b-side'
            const successResponse = syncWebhookSuccessResponse()

            getEngineResponseServerIdMock.mockReturnValue(sharedServerId)
            const appWatcher = engineResponseWatcher(mockLog)
            const workerWatcher = engineResponseWatcher(mockLog)

            expect(appWatcher.getServerId(), 'WORKER must use the same stable id as APP').toBe(workerWatcher.getServerId())

            await appWatcher.init()

            const listenerPromise = appWatcher.oneTimeListener(
                webhookRequestId,
                true,
                2000,
                syncWebhookTimeoutResponse(),
            )

            await workerWatcher.publish(sharedServerId, webhookRequestId, successResponse)

            const result = await listenerPromise

            expect(result, 'sync webhook must return engine response when pub/sub channel matches').toEqual(successResponse)
            expect(result.status, 'sync webhook must not time out with 204 when channel is aligned').toBe(StatusCodes.OK)
            expect(result.body, 'sync webhook body must be forwarded to the HTTP caller').toEqual({ ok: true })

            await appWatcher.shutdown()
        })
    })
    // END stable-engine-response-server-id B side
})
