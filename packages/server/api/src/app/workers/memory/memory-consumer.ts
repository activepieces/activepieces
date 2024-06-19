import { isNil } from 'lodash'
import { ConsumerManager } from '../consumer/consumer-manager'
import { memoryQueues } from './memory-queue'

export const memoryConsumer: ConsumerManager = {
    async poll(queueName, _token) {
        const job = await memoryQueues[queueName].poll()
        if (isNil(job)) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            return undefined
        }
        return job.data
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