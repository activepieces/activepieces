import { isNil } from '@activepieces/shared'
import { ConsumerManager } from '../consumer/consumer-manager'
import { memoryQueues } from './memory-queue'

export const memoryConsumer: ConsumerManager = {
    async poll(queueName) {
        const job = await memoryQueues[queueName].poll()
        if (isNil(job)) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            return null
        }
        return {
            id: job.id,
            data: job.data,
            attempsStarted: 1,
        }
    },
    async update(_params): Promise<void> {
        // 
    },
    async init(): Promise<void> {
        return
    },
    async close(): Promise<void> {
        return
    },
}