import { exceptionHandler, JobData, JobStatus, OneTimeJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, UserInteractionJobData, WebhookJobData } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService, workerApiService } from './api/server-api.service'
import { flowJobExecutor } from './executors/flow-job-executor'
import { repeatingJobExecutor } from './executors/repeating-job-executor'
import { userInteractionJobExecutor } from './executors/user-interaction-job-executor'
import { webhookExecutor } from './executors/webhook-job-executor'
import { jobPoller } from './job-polling'
import { workerMachine } from './utils/machine'

let closed = true
let workerToken: string
let heartbeatInterval: NodeJS.Timeout

export const flowWorker = (log: FastifyBaseLogger) => ({
    async init({ workerToken: token }: { workerToken: string }): Promise<void> {
        closed = false
        workerToken = token
        await initializeWorker(log)
        heartbeatInterval = setInterval(() => {
            rejectedPromiseHandler(workerApiService(workerToken).heartbeat(), log)
        }, 15000)

        const FLOW_WORKER_CONCURRENCY = workerMachine.getSettings().FLOW_WORKER_CONCURRENCY
        const SCHEDULED_WORKER_CONCURRENCY = workerMachine.getSettings().SCHEDULED_WORKER_CONCURRENCY
        log.info({
            FLOW_WORKER_CONCURRENCY,
            SCHEDULED_WORKER_CONCURRENCY,
        }, 'Starting worker')
        for (const queueName of Object.values(QueueName)) {
            const times = queueName === QueueName.SCHEDULED ? SCHEDULED_WORKER_CONCURRENCY : FLOW_WORKER_CONCURRENCY
            log.info({
                queueName,
                times,
            }, 'Starting polling queue with concurrency')
            for (let i = 0; i < times; i++) {
                rejectedPromiseHandler(run(queueName, log), log)
            }
        }
    },
    async close(): Promise<void> {
        closed = true
        clearTimeout(heartbeatInterval)
    },
})

async function initializeWorker(log: FastifyBaseLogger): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            const heartbeatResponse = await workerApiService(workerToken).heartbeat()
            if (isNil(heartbeatResponse)) {
                throw new Error('The worker is unable to reach the server')
            }
            await workerMachine.init(heartbeatResponse)
            break
        }
        catch (error) {
            log.error({
                error,
            }, 'The worker is unable to reach the server')
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    }
}

async function run<T extends QueueName>(queueName: T, log: FastifyBaseLogger): Promise<void> {
    while (!closed) {
        let engineToken: string | undefined
        try {
            const job = await jobPoller.poll(workerToken, queueName)
            log.trace({
                job: {
                    queueName,
                    jobId: job?.id,
                },
            }, 'Job polled')
            if (isNil(job)) {
                continue
            }
            const { data, engineToken: jobEngineToken } = job
            engineToken = jobEngineToken
            await consumeJob(queueName, data, engineToken, log)
            await markJobAsCompleted(queueName, engineToken, log)
            log.debug({
                job: {
                    queueName,
                    jobId: job?.id,
                },
            }, 'Job completed')
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            if (engineToken) {
                rejectedPromiseHandler(
                    engineApiService(engineToken, log).updateJobStatus({
                        status: JobStatus.FAILED,
                        queueName,
                        message: (e as Error)?.message ?? 'Unknown error',
                    }),
                    log,
                )
            }
        }
    }
}

async function consumeJob(queueName: QueueName, jobData: JobData, engineToken: string, log: FastifyBaseLogger): Promise<void> {
    switch (queueName) {
        case QueueName.USERS_INTERACTION:
            await userInteractionJobExecutor(log).execute(jobData as UserInteractionJobData, engineToken, workerToken)
            break
        case QueueName.ONE_TIME:
            await flowJobExecutor(log).executeFlow(jobData as OneTimeJobData, engineToken)
            break
        case QueueName.SCHEDULED:
            await repeatingJobExecutor(log).executeRepeatingJob({
                data: jobData as RepeatingJobData,
                engineToken,
                workerToken,
            })
            break
        case QueueName.WEBHOOK: {
            await webhookExecutor(log).consumeWebhook(jobData as WebhookJobData, engineToken, workerToken)
            break
        }
    }
}

async function markJobAsCompleted(queueName: QueueName, engineToken: string, log: FastifyBaseLogger): Promise<void> {
    switch (queueName) {
        case QueueName.ONE_TIME: {
            // This is will be marked as completed in update-run endpoint
            break
        }
        case QueueName.USERS_INTERACTION:
        case QueueName.SCHEDULED:
        case QueueName.WEBHOOK: {
            await engineApiService(engineToken, log).updateJobStatus({
                status: JobStatus.COMPLETED,
                queueName,
            })
        }
    }
}