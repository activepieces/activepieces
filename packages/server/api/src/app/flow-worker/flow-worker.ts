import { repeatingJobExecutor } from './job-executor/repeating-job-executor'
import { webhookExecutor } from './job-executor/webhook-job-executor'
import { ApSemaphore, exceptionHandler, JobData, JobStatus, OneTimeJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, system, SystemProp, WebhookJobData } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import {  engineApiService, flowJobExecutor, workerApiService } from 'server-worker'

const WORKER_CONCURRENCY = system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10
const workerLocks = new ApSemaphore(WORKER_CONCURRENCY)

let closed = true

export const flowWorker = {
    async init(): Promise<void> {
        closed = false
        for (const queueName of Object.values(QueueName)) {
            rejectedPromiseHandler(run(queueName))
        }
    },
    async close(): Promise<void> {
        closed = true
    },
}

async function run<T extends QueueName>(queueName: T): Promise<void> {
    while (!closed) {
        try {
            await workerLocks.acquire()
            const job = await workerApiService().poll(queueName)
            if (isNil(job)) {
                workerLocks.release()
                continue
            }
            const { data, engineToken } = job
            consumeJob(queueName, data, engineToken)
                .then(() => {
                    rejectedPromiseHandler(engineApiService(engineToken).updateJobStatus(queueName, JobStatus.COMPLETED, ''))
                })
                .catch((e) => {
                    rejectedPromiseHandler(engineApiService(engineToken).updateJobStatus(queueName, JobStatus.FAILED, e.message))
                    exceptionHandler.handle(e)
                }).finally(() => {
                    workerLocks.release()
                })
        }
        catch (e) {
            workerLocks.release()
            exceptionHandler.handle(e)
        }
    }
}

async function consumeJob(queueName: QueueName, jobData: JobData, engineToken: string | undefined): Promise<void> {
    switch (queueName) {
        case QueueName.ONE_TIME:
            await flowJobExecutor.executeFlow(jobData as OneTimeJobData, engineToken!)
            break
        case QueueName.SCHEDULED:
            await repeatingJobExecutor.executeRepeatingJob(jobData as RepeatingJobData)
            break
        case QueueName.WEBHOOK:
            await webhookExecutor.consumeWebhook(jobData as WebhookJobData)
            break
    }
}