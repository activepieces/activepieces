import {  ApQueueJob, QueueName,  system, WorkerSystemProps } from '@activepieces/server-shared'
import { Semaphore } from 'async-mutex'
import { workerApiService } from './api/server-api.service'

const POLLING_CONCURRENCY = system.getNumberOrThrow(WorkerSystemProps.POLLING_CONCURRENCY)

const pollLocks = {
    [QueueName.ONE_TIME]: new Semaphore(POLLING_CONCURRENCY),
    [QueueName.SCHEDULED]: new Semaphore(POLLING_CONCURRENCY),
    [QueueName.WEBHOOK]: new Semaphore(POLLING_CONCURRENCY),
}

export async function pollJob(workerToken: string, queueName: QueueName): Promise<ApQueueJob | null> {
    try {
        await pollLocks[queueName].acquire(1)
        const job = await workerApiService(workerToken).poll(queueName)
        return job
    }
    finally {
        pollLocks[queueName].release(1)
    }
}