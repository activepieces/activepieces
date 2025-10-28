import { apId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pubsub } from '../helper/pubsub'

type EngineResponseWithId<T> = { requestId: string, response: T }

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
            (_channel: string, message: string  ) => {
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

    async oneTimeListener<T>(requestId: string, timeoutRequest: boolean, timeoutMs: number | undefined, defaultResponse: T | undefined): Promise<T> {
        log.info('[engineWatcher#listen]')

        return new Promise<T>((resolve) => {
            let timeout: NodeJS.Timeout

            if (timeoutRequest) {
                timeout = setTimeout(() => {
                    log.info('[engineWatcher#listen] Timeout reached')
                    listeners.delete(requestId)
                    resolve(defaultResponse as T)
                }, timeoutMs)
            }

            const responseHandler = (flowResponse: EngineResponseWithId<unknown>) => {
                if (timeout) {
                    clearTimeout(timeout)
                }
                listeners.delete(requestId)
                log.info({ requestId }, '[engineWatcher#listen] Response received')
                resolve(flowResponse.response as T)
            }

            listeners.set(requestId, responseHandler)
        })
    },

    async publish<T>(
        requestId: string,
        workerServerId: string, 
        response: T,
    ): Promise<void> {
        log.info({ requestId }, '[engineWatcher#publish]')
        
        const message: EngineResponseWithId<T> = { requestId, response }
        await pubsub.publish(
            `engine-run:sync:${workerServerId}`, 
            JSON.stringify(message),
        )
    },

    async shutdown(): Promise<void> {
        await pubsub.unsubscribe(`engine-run:sync:${SERVER_ID}`)
    },
})
