import { ConsumeJobRequest, ConsumeJobResponse, ConsumeJobResponseStatus, isNil, JobData, tryCatch } from '@activepieces/shared'
import { Worker as BullMQWorker, Job } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { getPlatformQueueName, QueueName } from '../job'
import { jobMigrations } from '../migrations/job-data-migrations'
import { rateLimiterInterceptor } from './interceptors/rate-limiter-interceptor'
import { InterceptorVerdict, JobInterceptor } from './job-interceptor'
import { createQueueDispatcher, QueueDispatcher } from './queue-dispatcher'

const DRAIN_DELAY_SECONDS = 15

const interceptors: JobInterceptor[] = [rateLimiterInterceptor]
const workerPromises = new Map<string, Promise<BullMQWorker>>()
const dispatchers = new Map<string, QueueDispatcher>()
const activeJobs = new Map<string, { job: Job, token: string, jobData: JobData }>()

function ensureBullMQWorker(queueName: string, log: FastifyBaseLogger): Promise<BullMQWorker> {
    const existing = workerPromises.get(queueName)
    if (existing) return existing

    const promise = createBullMQWorker(queueName, log)
    workerPromises.set(queueName, promise)
    return promise
}

async function createBullMQWorker(queueName: string, log: FastifyBaseLogger): Promise<BullMQWorker> {
    const isOtelEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
    const worker = new BullMQWorker(
        queueName,
        undefined,
        {
            connection: await redisConnections.create(),
            telemetry: isOtelEnabled ? new BullMQOtel(queueName) : undefined,
            concurrency: 10000,
            autorun: false,
            lockDuration: 120_000,
            stalledInterval: 30_000,
            maxStalledCount: 3,
            drainDelay: DRAIN_DELAY_SECONDS,
        },
    )
    await worker.waitUntilReady()
    await worker.startStalledCheckTimer()

    log.info({ queueName }, '[jobBroker] BullMQ worker initialized')
    return worker
}

function ensureDispatcher(queueName: string, worker: BullMQWorker, log: FastifyBaseLogger): QueueDispatcher {
    const existing = dispatchers.get(queueName)
    if (existing) return existing

    const dispatcher = createQueueDispatcher({
        queueName,
        worker,
        dequeue: tryDequeue,
        onOrphanedJob: returnJobToQueue,
        log,
    })
    dispatchers.set(queueName, dispatcher)
    return dispatcher
}

async function tryDequeue(worker: BullMQWorker, queueName: string, log: FastifyBaseLogger): Promise<ConsumeJobRequest | null> {
    const token = `token-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const job = await worker.getNextJob(token)
    if (isNil(job)) {
        return null
    }
    log.info({ queueName, jobId: job.id, jobName: job.name }, '[jobBroker#tryDequeue] Dequeued job')

    const migratedData = await jobMigrations(log).apply(job.data)
    const jobId = job.id ?? job.name

    activeJobs.set(jobId, { job, token, jobData: migratedData })

    const interceptorResult = await runInterceptors({ jobId, jobData: migratedData, job, log })
    if (interceptorResult !== null) {
        await job.moveToDelayed(Date.now() + interceptorResult.delayInMs, token)
        if (interceptorResult.priority !== undefined) {
            await job.changePriority({ priority: interceptorResult.priority })
        }
        activeJobs.delete(jobId)
        return null
    }

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

async function returnJobToQueue(jobId: string, log: FastifyBaseLogger): Promise<void> {
    const entry = activeJobs.get(jobId)
    if (!entry) {
        log.warn({ jobId }, '[jobBroker#returnJobToQueue] job not found in activeJobs')
        return
    }
    const { job, token, jobData } = entry
    await job.moveToDelayed(Date.now(), token)
    activeJobs.delete(jobId)
    for (const interceptor of interceptors) {
        const { error } = await tryCatch(() => interceptor.onJobFinished({ jobId, jobData, log }))
        if (error) {
            log.error({ jobId, error: String(error) }, '[jobBroker#returnJobToQueue] interceptor cleanup failed')
        }
    }
    log.info({ jobId }, '[jobBroker#returnJobToQueue] orphaned job returned to queue')
}

async function runInterceptors({ jobId, jobData, job, log }: { jobId: string, jobData: JobData, job: Job, log: FastifyBaseLogger }): Promise<{ delayInMs: number, priority?: number } | null> {
    const passed: JobInterceptor[] = []
    for (const interceptor of interceptors) {
        const result = await interceptor.preDispatch({ jobId, jobData, job, log })
        if (result.verdict === InterceptorVerdict.REJECT) {
            for (const passedInterceptor of passed) {
                const { error } = await tryCatch(() => passedInterceptor.onJobFinished({ jobId, jobData, log }))
                if (error) {
                    log.error({ jobId, error: String(error) }, '[jobBroker] Failed to clean up interceptor on reject')
                }
            }
            return { delayInMs: result.delayInMs, priority: result.priority }
        }
        passed.push(interceptor)
    }
    return null
}

export const jobBroker = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        await ensureBullMQWorker(QueueName.WORKER_JOBS, log)
        log.info('[jobBroker] Job broker initialized')
    },

    async poll(platformId?: string): Promise<ConsumeJobRequest | null> {
        const queueName = platformId ? getPlatformQueueName(platformId) : QueueName.WORKER_JOBS
        const worker = await ensureBullMQWorker(queueName, log)
        const dispatcher = ensureDispatcher(queueName, worker, log)
        return dispatcher.poll()
    },

    async completeJob(input: ConsumeJobResponse & { jobId: string }): Promise<void> {
        const entry = activeJobs.get(input.jobId)
        if (!entry) {
            log.warn({ jobId: input.jobId }, '[jobBroker] completeJob called for unknown job')
            return
        }

        const { job, token, jobData } = entry

        const { error } = await tryCatch(async () => {
            if (input.delayInSeconds && input.delayInSeconds > 0) {
                await job.moveToDelayed(Date.now() + input.delayInSeconds * 1000, token)
                return
            }

            if (input.status === ConsumeJobResponseStatus.INTERNAL_ERROR) {
                await job.moveToFailed(new Error(input.errorMessage ?? 'Internal error'), token)
                return
            }

            await job.moveToCompleted({ response: input.response ?? undefined }, token, false)
        })
        if (error) {
            log.error({ jobId: input.jobId, error: String(error) }, '[jobBroker] Failed to move job to final state')
        }

        activeJobs.delete(input.jobId)
        for (const interceptor of interceptors) {
            const { error: interceptorError } = await tryCatch(() => interceptor.onJobFinished({ jobId: input.jobId, jobData, log }))
            if (interceptorError) {
                log.error({ jobId: input.jobId, error: String(interceptorError) }, '[jobBroker] Interceptor onJobFinished failed')
            }
        }
    },

    async extendLock(input: { jobId: string }): Promise<void> {
        const entry = activeJobs.get(input.jobId)
        if (!entry) {
            log.warn({ jobId: input.jobId }, '[jobBroker] extendLock called for unknown job')
            return
        }
        const { job, token } = entry
        await job.extendLock(token, 120_000)
        log.debug({ jobId: input.jobId }, '[jobBroker] Lock extended')
    },

    async close(): Promise<void> {
        for (const dispatcher of dispatchers.values()) {
            dispatcher.close()
        }
        dispatchers.clear()

        const workers = await Promise.allSettled([...workerPromises.values()])
        await Promise.allSettled(
            workers
                .filter((r): r is PromiseFulfilledResult<BullMQWorker> => r.status === 'fulfilled')
                .map(r => r.value.close()),
        )
        workerPromises.clear()
        activeJobs.clear()
    },
})
