import { exceptionHandler, JobData, JobStatus, OneTimeJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, system, WebhookJobData, WorkerSystemProps } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { engineApiService, workerApiService } from './api/server-api.service'
import { flowJobExecutor } from './executors/flow-job-executor'
import { repeatingJobExecutor } from './executors/repeating-job-executor'
import { webhookExecutor } from './executors/webhook-job-executor'

const WORKER_CONCURRENCY = system.getNumber(WorkerSystemProps.FLOW_WORKER_CONCURRENCY) ?? 10

let closed = true
let workerToken: string

export const flowWorker = {
    async init(generatedToken: string): Promise<void> {
        closed = false
        workerToken = generatedToken
    },
    async start(): Promise<void> {
        if (WORKER_CONCURRENCY === 0) {
            return
        }
        for (const queueName of Object.values(QueueName)) {
            for (let i = 0; i < WORKER_CONCURRENCY; i++) {
                rejectedPromiseHandler(run(queueName))
            }
        }
    },
    async close(): Promise<void> {
        closed = true
    },
}

async function run<T extends QueueName>(queueName: T): Promise<void> {
    while (!closed) {
        let engineToken: string | undefined
        try {
            const job = await workerApiService(workerToken).poll(queueName)
            if (isNil(job)) {
                continue
            }
            const { data, engineToken: jobEngineToken } = job
            engineToken = jobEngineToken
            await consumeJob(queueName, data, engineToken)

            await engineApiService(engineToken).updateJobStatus({
                status: JobStatus.COMPLETED,
                queueName,
            })
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