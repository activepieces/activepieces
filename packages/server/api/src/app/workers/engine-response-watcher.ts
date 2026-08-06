import { apId, tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { pubsub } from '../helper/pubsub'

const listeners = new Map<string, (flowResponse: EngineResponseWithId<unknown>) => void>()
const SERVER_ID = apId()

export const engineResponseWatcher = (log: FastifyBaseLogger) => ({
    getServerId(): string {
        return SERVER_ID
    },

    async init(): Promise<void> {
        log.info('[engineResponseWatcher#init] Initializing engine run watcher')
        await pubsub.subscribe(
            `engine-run:sync:${SERVER_ID}`,
            (message: string) => {
                const parsedMessage: EngineResponseWithId<unknown> = JSON.parse(message)
                const listener = listeners.get(parsedMessage.requestId)

                if (listener) {
                    listener(parsedMessage)
                }

                log.info(
                    { requestId: parsedMessage.requestId },
                    '[engineWatcher#init]',
                )
            },
        )
    },

    async waitForResponse<T>({ requestId, timeoutMs, defaultResponse, enqueue }: WaitForResponseParams<T>): Promise<T> {
        const pending = registerListener({ requestId, timeoutMs, defaultResponse, log })
        const { error } = await tryCatch(enqueue)
        if (error) {
            pending.cancel()
            throw error
        }
        return pending.response
    },

    async publish(webserverId: string, requestId: string, response: unknown): Promise<void> {
        await pubsub.publish(
            `engine-run:sync:${webserverId}`,
            JSON.stringify({ requestId, response }),
        )
    },

    async shutdown(): Promise<void> {
        await pubsub.unsubscribe(`engine-run:sync:${SERVER_ID}`)
    },
})

export function registerListener<T>({ requestId, timeoutMs, defaultResponse, log }: RegisterListenerParams<T>): PendingEngineResponse<T> {
    log.info({ requestId }, '[engineWatcher#registerListener]')
    let cancel: () => void = () => undefined
    const response = new Promise<T>((resolve) => {
        const timeout = setTimeout(() => {
            log.info({ requestId }, '[engineWatcher#registerListener] Timeout reached')
            listeners.delete(requestId)
            resolve(defaultResponse)
        }, timeoutMs)
        const settle = (value: T): void => {
            clearTimeout(timeout)
            listeners.delete(requestId)
            resolve(value)
        }
        listeners.set(requestId, (engineResponse) => {
            log.info({ requestId }, '[engineWatcher#registerListener] Response received')
            settle(engineResponse.response as T)
        })
        cancel = () => settle(defaultResponse)
    })
    return { response, cancel }
}

type EngineResponseWithId<T> = { requestId: string, response: T }

type ListenerParams<T> = {
    requestId: string
    timeoutMs: number
    defaultResponse: T
}

type WaitForResponseParams<T> = ListenerParams<T> & {
    enqueue: () => Promise<unknown>
}

type RegisterListenerParams<T> = ListenerParams<T> & {
    log: FastifyBaseLogger
}

export type PendingEngineResponse<T> = {
    response: Promise<T>
    cancel: () => void
}
