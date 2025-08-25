import { readdir, rm } from 'fs/promises'
import path from 'path'
import { AgentJobData, exceptionHandler, GLOBAL_CACHE_ALL_VERSIONS_PATH, JobData, JobStatus, LATEST_CACHE_VERSION, OneTimeJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, UserInteractionJobData, WebhookJobData } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService, workerApiService } from './api/server-api.service'
import { agentJobExecutor } from './executors/agent-job-executor'
import { flowJobExecutor } from './executors/flow-job-executor'
import { repeatingJobExecutor } from './executors/repeating-job-executor'
import { userInteractionJobExecutor } from './executors/user-interaction-job-executor'
import { webhookExecutor } from './executors/webhook-job-executor'
import { jobPoller } from './job-polling'
import { engineRunner } from './runner'
import { engineRunnerSocket } from './runner/engine-runner-socket'
import { workerMachine } from './utils/machine'

let closed = true
let workerToken: string
let heartbeatInterval: NodeJS.Timeout

export const flowWorker = (log: FastifyBaseLogger) => ({
    async init({ workerToken: token }: { workerToken: string }): Promise<void> {
        rejectedPromiseHandler(deleteStaleCache(log), log)
        await engineRunnerSocket(log).init()

        closed = false
        workerToken = token
        await initializeWorker(log)
        heartbeatInterval = setInterval(() => {
            rejectedPromiseHandler(workerApiService(workerToken).heartbeat(), log)
        }, 15000)

        const FLOW_WORKER_CONCURRENCY = workerMachine.getSettings().FLOW_WORKER_CONCURRENCY
        const SCHEDULED_WORKER_CONCURRENCY = workerMachine.getSettings().SCHEDULED_WORKER_CONCURRENCY
        const AGENTS_WORKER_CONCURRENCY = workerMachine.getSettings().AGENTS_WORKER_CONCURRENCY
        log.info({
            FLOW_WORKER_CONCURRENCY,
            SCHEDULED_WORKER_CONCURRENCY,
            AGENTS_WORKER_CONCURRENCY,
        }, 'Starting worker')
        for (const queueName of Object.values(QueueName)) {
            const times = queueName === QueueName.SCHEDULED ?
                SCHEDULED_WORKER_CONCURRENCY : queueName === QueueName.AGENTS ? AGENTS_WORKER_CONCURRENCY : FLOW_WORKER_CONCURRENCY
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
        await engineRunnerSocket(log).disconnect()
        closed = true
        clearTimeout(heartbeatInterval)
        if (workerMachine.hasSettings()) {
            await engineRunner(log).shutdownAllWorkers()
        }
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
                    attempsStarted: job?.attempsStarted,
                },
            }, 'Job polled')
            if (isNil(job)) {
                continue
            }
            const { data, engineToken: jobEngineToken, attempsStarted } = job
            engineToken = jobEngineToken
            await consumeJob(job.id, queueName, data, attempsStarted, engineToken, log)
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

async function consumeJob(jobId: string, queueName: QueueName, jobData: JobData, attempsStarted: number, engineToken: string, log: FastifyBaseLogger): Promise<void> {
    switch (queueName) {
        case QueueName.USERS_INTERACTION:
            await userInteractionJobExecutor(log).execute(jobData as UserInteractionJobData, engineToken, workerToken)
            break
        case QueueName.ONE_TIME:
            await flowJobExecutor(log).executeFlow(jobData as OneTimeJobData, attempsStarted, engineToken)
            break
        case QueueName.SCHEDULED:
            await repeatingJobExecutor(log).executeRepeatingJob({
                jobId,
                data: jobData as RepeatingJobData,
                engineToken,
                workerToken,
            })
            break
        case QueueName.WEBHOOK: {
            await webhookExecutor(log).consumeWebhook(jobId, jobData as WebhookJobData, engineToken, workerToken)
            break
        }
        case QueueName.AGENTS: {
            await agentJobExecutor(log).executeAgent({
                jobData: jobData as AgentJobData,
                engineToken,
                workerToken,
            })
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
        case QueueName.AGENTS:
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

async function deleteStaleCache(log: FastifyBaseLogger): Promise<void> {
    try {
        const cacheDir = path.resolve(GLOBAL_CACHE_ALL_VERSIONS_PATH)
        const entries = await readdir(cacheDir, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== LATEST_CACHE_VERSION) {
                await rm(path.join(cacheDir, entry.name), { recursive: true })
            }
        }
    }
    catch (error) {
        exceptionHandler.handle(error, log)
    }
}