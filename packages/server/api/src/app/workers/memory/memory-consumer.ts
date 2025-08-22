import { FastifyBaseLogger } from 'fastify'
import { ConsumerManager } from '../consumer/types'
import { memoryQueues } from './memory-queue'
import { QueueName } from '@activepieces/server-shared'

export const memoryConsumer = (log: FastifyBaseLogger): ConsumerManager => {
    const queues = memoryQueues(log)
    
    return {
        async init(): Promise<void> {
            log.info({
                message: 'Initializing memory consumer',
            })
            
        },
        async close(): Promise<void> {
            log.info({
                message: 'Closing memory consumer',
            })
            
            // Stop all queue consumers
            await Promise.all([
                queues[QueueName.ONE_TIME].stopConsuming(),
                queues[QueueName.SCHEDULED].stopConsuming(),
                queues[QueueName.WEBHOOK].stopConsuming(),
                queues[QueueName.USERS_INTERACTION].stopConsuming(),
                queues[QueueName.AGENTS].stopConsuming(),
            ])
        },
    }
}