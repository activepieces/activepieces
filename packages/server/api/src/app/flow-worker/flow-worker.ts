import { nanoid } from 'nanoid'
import { flowConsumer } from './consumer'
import { flowJobExecutor } from './job-executor/flow-job-executor'
import { repeatingJobExecutor } from './job-executor/reapeating-job-executor'
import { webhookExecutor } from './job-executor/webhook-job-executor'
import { ApSemaphore, exceptionHandler, JobStatus, QueueName, rejectedPromiseHandler, system, SystemProp } from '@activepieces/server-shared'
import { JobData, OneTimeJobData, RepeatingJobData, WebhookJobData } from 'server-worker'

const WORKER_TOKEN = nanoid()
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
        await flowConsumer.close()
    },
}

async function run<T extends QueueName>(queueName: T): Promise<void> {
    while (!closed) {
        try {
            await workerLocks.acquire()
            const job = await flowConsumer.poll(queueName, WORKER_TOKEN)
            if (!job) {
                workerLocks.release()
                continue
            }
            const { id, data } = job
            consumeJob(queueName, data)
                .then(() => {
                    rejectedPromiseHandler(flowConsumer.update({ jobId: id, queueName, status: JobStatus.COMPLETED, message: '', token: WORKER_TOKEN }))
                })
                .catch((e) => {
                    rejectedPromiseHandler(flowConsumer.update({ jobId: id, queueName, status: JobStatus.FAILED, message: e.message, token: WORKER_TOKEN }))
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

async function consumeJob(queueName: QueueName, jobData: JobData): Promise<void> {
    switch (queueName) {
        case QueueName.ONE_TIME:
            await flowJobExecutor.executeFlow(jobData as OneTimeJobData)
            break
        case QueueName.SCHEDULED:
            await repeatingJobExecutor.executeRepeatingJob(jobData as RepeatingJobData)
            break
        case QueueName.WEBHOOK:
            await webhookExecutor.consumeWebhook(jobData as WebhookJobData)
            break
    }
}