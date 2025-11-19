import { pubsubFactory } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { workerRedisConnections } from './worker-redis'

type EngineResponseWithId<T> = { requestId: string, response: T }

const pubsub = pubsubFactory(workerRedisConnections.create)

export const engineResponsePublisher = (log: FastifyBaseLogger) => ({
    async publish<T>(
        requestId: string,
        workerServerId: string, 
        response: T,
    ): Promise<void> {
        log.info({ requestId }, '[engineResponsePublisher#publish]')
        
        const message: EngineResponseWithId<T> = { requestId, response }
        await pubsub.publish(
            `engine-run:sync:${workerServerId}`, 
            JSON.stringify(message),
        )
    },
})

