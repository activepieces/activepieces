import { apId } from '@activepieces/shared'
import { logger } from '@sentry/utils'
import { pubsub } from '../helper/pubsub'

type EngineResponseWithId<T> = { requestId: string, response: T }

const listeners = new Map<string, (flowResponse: EngineResponseWithId<unknown>) => void>()
const SERVER_ID = apId()

export const engineResponseWatcher = {
    getServerId(): string {
        return SERVER_ID
    },

    async init(): Promise<void> {
        logger.info('[engineResponseWatcher#init] Initializing engine run watcher')
        
        await pubsub().subscribe(
            `engine-run:sync:${SERVER_ID}`,
            (_channel, message) => {
                const parsedMessage: EngineResponseWithId<unknown> = JSON.parse(message)
                const listener = listeners.get(parsedMessage.requestId)
                
                if (listener) {
                    listener(parsedMessage)
                }
                
                logger.info(
                    { requestId: parsedMessage.requestId }, 
                    '[engineWatcher#init]',
                )
            },
        )
    },

    async oneTimeListener<T>(requestId: string, timeoutRequest: boolean, timeoutMs: number | undefined, defaultResponse: T | undefined): Promise<T> {
        logger.info({ requestId }, '[engineWatcher#listen]')

        return new Promise<T>((resolve) => {
            let timeout: NodeJS.Timeout

            if (timeoutRequest) {
                timeout = setTimeout(() => {
                    listeners.delete(requestId)
                    resolve(defaultResponse as T)
                }, timeoutMs)
            }

            const responseHandler = (flowResponse: EngineResponseWithId<unknown>) => {
                if (timeout) {
                    clearTimeout(timeout)
                }
                listeners.delete(requestId)
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
        logger.info({ requestId }, '[engineWatcher#publish]')
        
        const message: EngineResponseWithId<T> = { requestId, response }
        await pubsub().publish(
            `engine-run:sync:${workerServerId}`, 
            JSON.stringify(message),
        )
    },

    async shutdown(): Promise<void> {
        await pubsub().unsubscribe(`engine-run:sync:${SERVER_ID}`)
    },
}

