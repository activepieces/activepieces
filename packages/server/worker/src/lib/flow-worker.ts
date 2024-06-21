import { ApSemaphore, exceptionHandler, JobData, JobStatus, OneTimeJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, system, SystemProp, WebhookJobData } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { repeatingJobExecutor } from './executors/repeating-job-executor'
import { workerApiService } from './api/server-api.service'
import { flowJobExecutor } from './executors/flow-job-executor'
import { webhookExecutor } from './executors/webhook-job-executor'

const WORKER_CONCURRENCY = system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10
const workerLocks = new ApSemaphore(WORKER_CONCURRENCY)

let closed = true
let workerToken: string

export const flowWorker = {
    async init(generatedToken: string): Promise<void> {
        closed = false
        workerToken = generatedToken
    },
    async start(): Promise<void> {
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
            const job = await workerApiService(workerToken).poll(queueName)
            if (isNil(job)) {
                workerLocks.release()
                continue
            }
            const { data, engineToken } = job
            consumeJob(queueName, data, engineToken)
                .then(() => {
                    rejectedPromiseHandler(workerApiService(workerToken).updateJobStatus({
                        status: JobStatus.COMPLETED,
                        queueName,
                    }))
                })
                .catch((e) => {
                    rejectedPromiseHandler(workerApiService(workerToken).updateJobStatus({
                        status: JobStatus.FAILED,
                        queueName,
                        message: e.message,
                    }))
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
        case QueueName.WEBHOOK:{
            await webhookExecutor.consumeWebhook(jobData as WebhookJobData, engineToken, workerToken)
            break;
        }
    }
}