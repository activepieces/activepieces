import { FastifyBaseLogger } from 'fastify'
import { pubsub } from '@api/helper/pubsub'
import { getEngineResponseServerId } from '@api/workers/engine-response-server-id'

type EngineResponseWithId<T> = { requestId: string, response: T }

const listeners = new Map<string, (flowResponse: EngineResponseWithId<unknown>) => void>()

export const engineResponseWatcher = (log: FastifyBaseLogger) => ({
    getServerId(): string {
        return getEngineResponseServerId()
    },

    async init(): Promise<void> {
        const serverId = getEngineResponseServerId()
        log.info({ serverId }, '[engineResponseWatcher#init] Initializing engine run watcher')
        await pubsub.subscribe(
            `engine-run:sync:${serverId}`,
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

    async publish(webserverId: string, requestId: string, response: unknown): Promise<void> {
        await pubsub.publish(
            `engine-run:sync:${webserverId}`,
            JSON.stringify({ requestId, response }),
        )
    },

    async shutdown(): Promise<void> {
        await pubsub.unsubscribe(`engine-run:sync:${getEngineResponseServerId()}`)
    },
})
