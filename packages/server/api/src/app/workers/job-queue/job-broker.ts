import { AppSystemProp, QueueName } from '@activepieces/server-common'
import { ConsumeJobRequest, ConsumeJobResponse, ConsumeJobResponseStatus, isNil } from '@activepieces/shared'
import { Worker as BullMQWorker, Job, QueueEvents } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { jobMigrations } from '../migrations/job-data-migrations'
import { jobQueue } from './job-queue'

const LONG_POLL_TIMEOUT_MS = 25_000

const bullmqWorkers = new Map<string, BullMQWorker>()
const queueEventsMap = new Map<string, QueueEvents>()
const activeJobs = new Map<string, { job: Job, token: string }>()
const pendingPollers = new Map<string, Array<{
    resolve: (job: ConsumeJobRequest | null) => void
    timer: ReturnType<typeof setTimeout>
}>>()

async function ensureBullMQWorker(queueName: string, log: FastifyBaseLogger): Promise<BullMQWorker> {
    const existing = bullmqWorkers.get(queueName)
    if (existing) return existing

    const isOtelEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
    const worker = new BullMQWorker(
        queueName,
        undefined,
        {
            connection: await redisConnections.create(),
            telemetry: isOtelEnabled ? new BullMQOtel(queueName) : undefined,
            concurrency: queueName === QueueName.WORKER_JOBS ? 10 : 5,
            autorun: false,
        },
    )
    await worker.waitUntilReady()
    bullmqWorkers.set(queueName, worker)

    const queueEvents = new QueueEvents(queueName, {
        connection: await redisConnections.create(),
    })
    await queueEvents.waitUntilReady()
    queueEventsMap.set(queueName, queueEvents)

    queueEvents.on('waiting', () => {
        drainPendingPollers(queueName, log)
    })

    log.info({ queueName }, '[jobBroker] BullMQ worker and queue events initialized')
    return worker
}

function drainPendingPollers(queueName: string, log: FastifyBaseLogger): void {
    const pollers = pendingPollers.get(queueName)
    if (!pollers || pollers.length === 0) return

    const poller = pollers.shift()!
    clearTimeout(poller.timer)
    tryDequeue(queueName, log).then((result) => {
        poller.resolve(result)
    }).catch((err) => {
        log.error({ err, queueName }, '[jobBroker] Error dequeuing on waiting event')
        poller.resolve(null)
    })
}

async function tryDequeue(queueName: string, log: FastifyBaseLogger): Promise<ConsumeJobRequest | null> {
    const worker = bullmqWorkers.get(queueName)
    if (!worker) {
        log.debug({ queueName }, '[jobBroker#tryDequeue] No BullMQ worker for queue')
        return null
    }

    const token = `token-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const job = await worker.getNextJob(token)
    if (isNil(job)) {
        log.debug({ queueName }, '[jobBroker#tryDequeue] No job available in queue')
        return null
    }
    log.info({ queueName, jobId: job.id, jobName: job.name }, '[jobBroker#tryDequeue] Dequeued job')

    const migratedData = await jobMigrations(log).apply(job.data)
    const jobId = job.id ?? job.name

    activeJobs.set(jobId, { job, token })

    const engineToken = await accessTokenManager(log).generateEngineToken({
        jobId,
        projectId: migratedData.projectId as string,
        platformId: migratedData.platformId,
    })

    return {
        jobId,
        jobData: migratedData,
        timeoutInSeconds: 600,
        attempsStarted: job.attemptsMade,
        engineToken,
    }
}

export const jobBroker = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const allQueues = jobQueue(log).getAllQueues()
        for (const queue of allQueues) {
            await ensureBullMQWorker(queue.name, log)
        }
        jobQueue(log).onQueueCreated(async (queueName: string) => {
            await ensureBullMQWorker(queueName, log)
        })
        log.info('[jobBroker] Job broker initialized')
    },

    async poll(): Promise<ConsumeJobRequest | null> {
        const allQueueNames = [...bullmqWorkers.keys()]
        log.info({ queues: allQueueNames }, '[jobBroker#poll] Polling across queues')

        for (const queueName of allQueueNames) {
            const result = await tryDequeue(queueName, log)
            if (result) return result
        }

        log.debug('[jobBroker#poll] No immediate jobs, waiting for waiting event or timeout')
        return new Promise<ConsumeJobRequest | null>((resolve) => {
            const timer = setTimeout(() => {
                for (const queueName of allQueueNames) {
                    const pollers = pendingPollers.get(queueName)
                    if (pollers) {
                        const idx = pollers.findIndex(p => p.resolve === resolve)
                        if (idx !== -1) pollers.splice(idx, 1)
                    }
                }
                resolve(null)
            }, LONG_POLL_TIMEOUT_MS)

            for (const queueName of allQueueNames) {
                if (!pendingPollers.has(queueName)) {
                    pendingPollers.set(queueName, [])
                }
                pendingPollers.get(queueName)!.push({ resolve, timer })
            }
        })
    },

    async completeJob(input: ConsumeJobResponse & { jobId: string }): Promise<void> {
        const entry = activeJobs.get(input.jobId)
        if (!entry) {
            log.warn({ jobId: input.jobId }, '[jobBroker] completeJob called for unknown job')
            return
        }

        const { job, token } = entry
        activeJobs.delete(input.jobId)

        if (input.delayInSeconds && input.delayInSeconds > 0) {
            await job.moveToDelayed(Date.now() + input.delayInSeconds * 1000, token)
            return
        }

        if (input.status === ConsumeJobResponseStatus.INTERNAL_ERROR) {
            await job.moveToFailed(new Error(input.errorMessage ?? 'Internal error'), token)
            return
        }

        await job.moveToCompleted({ response: input.response ?? undefined }, token)
    },

    async close(): Promise<void> {
        for (const pollers of pendingPollers.values()) {
            for (const p of pollers) {
                clearTimeout(p.timer)
                p.resolve(null)
            }
        }
        pendingPollers.clear()

        await Promise.allSettled([
            ...[...bullmqWorkers.values()].map(w => w.close()),
            ...[...queueEventsMap.values()].map(qe => qe.close()),
        ])
        bullmqWorkers.clear()
        queueEventsMap.clear()
        activeJobs.clear()
    },
})
