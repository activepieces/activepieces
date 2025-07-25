import { ApQueueJob, QueueName, systemConstants } from '@activepieces/server-shared'
import { Semaphore } from 'async-mutex'
import { workerApiService } from './api/server-api.service'

const POLLING_POOL_SIZE = systemConstants.POLLING_POOL_SIZE

const pollLocks = {
    [QueueName.ONE_TIME]: new Semaphore(POLLING_POOL_SIZE),
    [QueueName.SCHEDULED]: new Semaphore(POLLING_POOL_SIZE),
    [QueueName.WEBHOOK]: new Semaphore(POLLING_POOL_SIZE),
    [QueueName.USERS_INTERACTION]: new Semaphore(POLLING_POOL_SIZE),
    [QueueName.AGENTS]: new Semaphore(POLLING_POOL_SIZE),
}

export const jobPoller = {
    poll: async (workerToken: string, queueName: QueueName): Promise<ApQueueJob | null> => {
        try {
            await acquireLockToPreventFloodingApp(queueName)
            const job = await workerApiService(workerToken).poll(queueName)
            return job
        }
        finally {
            pollLocks[queueName].release(1)
        }
    },
}

async function acquireLockToPreventFloodingApp(queueName: QueueName): Promise<void> {
    await pollLocks[queueName].acquire(1)
}