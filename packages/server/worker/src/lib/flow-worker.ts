import { exceptionHandler, JobData, JobStatus, OneTimeJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, system, WebhookJobData, WorkerSystemProps } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { Semaphore } from 'async-mutex'
import { engineApiService, workerApiService } from './api/server-api.service'
import { flowJobExecutor } from './executors/flow-job-executor'
import { repeatingJobExecutor } from './executors/repeating-job-executor'
import { webhookExecutor } from './executors/webhook-job-executor'

const WORKER_CONCURRENCY = system.getNumberOrThrow(WorkerSystemProps.FLOW_WORKER_CONCURRENCY)
const POLLING_CONCURRENCY = system.getNumberOrThrow(WorkerSystemProps.POLLING_CONCURRENCY)
const SCHEDULED_WORKER_CONCURRENCY = system.getNumberOrThrow(WorkerSystemProps.SCHEDULED_WORKER_CONCURRENCY)
const SCHEDULED_POLLING_COUNT = system.getNumberOrThrow(WorkerSystemProps.SCHEDULED_POLLING_COUNT)

let closed = true
let workerToken: string
let heartbeatInterval: NodeJS.Timeout

const pollLocks = {
    [QueueName.ONE_TIME]: new Semaphore(POLLING_CONCURRENCY),
    [QueueName.SCHEDULED]: new Semaphore(POLLING_CONCURRENCY),
    [QueueName.WEBHOOK]: new Semaphore(POLLING_CONCURRENCY),
}

export const flowWorker = {
    async init(generatedToken: string): Promise<void> {
        closed = false
        workerToken = generatedToken
        heartbeatInterval = setInterval(() => {
            rejectedPromiseHandler(workerApiService(workerToken).heartbeat())
        }, 15000)
    },
    async start(): Promise<void> {
        for (const queueName of Object.values(QueueName)) {
            const times = queueName === QueueName.SCHEDULED ? SCHEDULED_WORKER_CONCURRENCY : WORKER_CONCURRENCY 
            const pollingCount = queueName === QueueName.SCHEDULED ? SCHEDULED_POLLING_COUNT : 1
            for (let i = 0; i < times; i++) {
                rejectedPromiseHandler(run(queueName, pollingCount))
            }
        }
    },
    async close(): Promise<void> {
        closed = true
        clearTimeout(heartbeatInterval)
    },
}

async function run<T extends QueueName>(queueName: T, _pollingCount = 1): Promise<void> {
    while (!closed) {
        let engineToken: string | undefined
        try {
            const jobs = await poll(workerToken, queueName, _pollingCount)

            if (jobs.length === 0) {
                continue
            }

            const promises = jobs.map(async (job) => {
                const { data, engineToken: jobEngineToken } = job
                engineToken = jobEngineToken
                await consumeJob(queueName, data, engineToken)
                await markJobAsCompleted(queueName, engineToken)
            })
            
            await Promise.all(promises)
        }
        catch (e) {
            exceptionHandler.handle(e)
            if (engineToken) {
                rejectedPromiseHandler(
                    engineApiService(engineToken).updateJobStatus({
                        status: JobStatus.FAILED,
                        queueName,
                        message: (e as Error)?.message ?? 'Unknown error',
                    }),
                )
            }
        }
    }
}

async function poll(workerToken: string, queueName: QueueName, _pollingCount = 1) {
    try {
        await pollLocks[queueName].acquire(1)
        const jobs = []
        for (let i = 0; i < _pollingCount; i++) {
            const job = await workerApiService(workerToken).poll(queueName)
            if (isNil(job)) {
                break
            }
            jobs.push(job)
        }
        return jobs
    }
    finally {
        pollLocks[queueName].release(1)
    }
}

async function consumeJob(queueName: QueueName, jobData: JobData, engineToken: string): Promise<void> {
    switch (queueName) {
        case QueueName.ONE_TIME:
            await flowJobExecutor.executeFlow(jobData as OneTimeJobData, engineToken)
            break
        case QueueName.SCHEDULED:
            await repeatingJobExecutor.executeRepeatingJob({
                data: jobData as RepeatingJobData,
                engineToken,
                workerToken,
            })
            break
        case QueueName.WEBHOOK: {
            await webhookExecutor.consumeWebhook(jobData as WebhookJobData, engineToken, workerToken)
            break
        }
    }
}

async function markJobAsCompleted(queueName: QueueName, engineToken: string): Promise<void> {
    switch (queueName) {
        case QueueName.ONE_TIME:{
            // This is will be marked as completed in update-run endpoint
            break
        }
        case QueueName.SCHEDULED:
        case QueueName.WEBHOOK:{
            await engineApiService(engineToken).updateJobStatus({
                status: JobStatus.COMPLETED,
                queueName,
            })
        }
    }
}