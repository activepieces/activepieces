import { isNil, tryCatch } from '@activepieces/core-utils'
import { ConsumeJobRequest, ConsumeJobResponse, EngineResponseStatus, JobData } from '@activepieces/shared'
import { Worker as BullMQWorker, Job, UnrecoverableError } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { redisConnections } from '../../database/redis-connections'
import { engineResponseWatcher } from '../engine-response-watcher'
import { QueueName } from '../job'
import { jobMigrations } from '../migrations/job-data-migrations'
import { chatConcurrencyInterceptor } from './interceptors/chat-concurrency-interceptor'
import { rateLimiterInterceptor } from './interceptors/rate-limiter-interceptor'
import { zombiePollingInterceptor } from './interceptors/zombie-polling-interceptor'
import { jobAssignmentTracker } from './job-assignment-tracker'
import { InterceptorVerdict, JobInterceptor } from './job-interceptor'
import { isUserInteractionJobData } from './job-queue'
import { createQueueDispatcher, QueueDispatcher } from './queue-dispatcher'

const DRAIN_DELAY_SECONDS = 15
const LOCK_DURATION_MS = 120_000

const interceptors: JobInterceptor[] = [rateLimiterInterceptor, chatConcurrencyInterceptor, zombiePollingInterceptor]
const workerPromises = new Map<string, Promise<BullMQWorker>>()
const dispatchers = new Map<string, QueueDispatcher>()

function ensureBullMQWorker(queueName: string, log: FastifyBaseLogger): Promise<BullMQWorker> {
    const existing = workerPromises.get(queueName)
    if (existing) return existing

    const promise = createBullMQWorker(queueName, log)
    workerPromises.set(queueName, promise)
    return promise
}

async function createBullMQWorker(queueName: string, log: FastifyBaseLogger): Promise<BullMQWorker> {
    const worker = new BullMQWorker(
        queueName,
        undefined,
        {
            connection: await redisConnections.create(),
            concurrency: 500,
            autorun: false,
            lockDuration: LOCK_DURATION_MS,
            stalledInterval: 30_000,
            maxStalledCount: 3,
            drainDelay: DRAIN_DELAY_SECONDS,
        },
    )
    await worker.waitUntilReady()
    await worker.startStalledCheckTimer()

    worker.on('stalled', (jobId: string) => {
        log.warn({ queueName, job: { id: jobId } }, '[jobBroker] Job stalled — BullMQ will retry automatically')
    })

    log.info({ queueName }, '[jobBroker] BullMQ worker initialized')
    return worker
}

async function fetchJobFromRedis(queueName: string, jobId: string, log: FastifyBaseLogger): Promise<Job | null> {
    const worker = await ensureBullMQWorker(queueName, log)
    const job = await Job.fromId(worker, jobId)
    if (isNil(job)) {
        log.warn({ job: { id: jobId }, queueName }, '[jobBroker] Job not found in Redis')
        return null
    }
    return job
}

function ensureDispatcher(queueName: string, worker: BullMQWorker, log: FastifyBaseLogger): QueueDispatcher {
    const existing = dispatchers.get(queueName)
    if (existing) return existing

    const dispatcher = createQueueDispatcher({
        queueName,
        worker,
        dequeue: tryDequeue,
        log,
    })
    dispatchers.set(queueName, dispatcher)
    return dispatcher
}

async function tryDequeue(worker: BullMQWorker, queueName: string, log: FastifyBaseLogger): Promise<ConsumeJobRequest | null> {
    const token = `token-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const job = await worker.getNextJob(token)
    if (isNil(job)) {
        return null  // waiting list empty — drainDelay provided backpressure
    }

    if (job.deferredFailure) {
        log.warn(
            { queueName, job: { id: job.id }, jobName: job.name, deferredFailure: job.deferredFailure },
            '[jobBroker#tryDequeue] Failing job with deferred failure (BullMQ stalled limit exceeded)',
        )
        const { error: failError } = await tryCatch(() => job.moveToFailed(new UnrecoverableError(job.deferredFailure), token, false))
        if (failError) {
            log.error(
                { queueName, job: { id: job.id }, error: String(failError) },
                '[jobBroker#tryDequeue] Failed to fail deferred-failure job',
            )
        }
        return tryDequeue(worker, queueName, log)
    }

    log.info({ queueName, job: { id: job.id }, jobName: job.name }, '[jobBroker#tryDequeue] Dequeued job')

    const originalSchemaVersion = (job.data as Record<string, unknown>).schemaVersion
    const migratedData = await jobMigrations(log).apply(job.data)
    const jobId = job.id ?? job.name

    if (migratedData.schemaVersion !== originalSchemaVersion) {
        await job.updateData(migratedData)
    }

    const parseResult = JobData.safeParse(migratedData)
    if (!parseResult.success) {
        const issues = parseResult.error.issues.map(issue => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ')
        const reason = `Job data failed schema validation after migration: ${issues}`
        log.error(
            { queueName, job: { id: jobId, type: migratedData.jobType }, schemaVersion: migratedData.schemaVersion, issues: parseResult.error.issues },
            '[jobBroker#tryDequeue] Failing job with invalid schema as unrecoverable',
        )
        const { error: failError } = await tryCatch(() => job.moveToFailed(new UnrecoverableError(reason), token, false))
        if (failError) {
            log.error({ queueName, job: { id: jobId }, error: String(failError) }, '[jobBroker#tryDequeue] Failed to fail invalid-schema job')
        }
        return tryDequeue(worker, queueName, log)
    }

    const interceptorResult = await runInterceptors({ jobId, jobData: migratedData, job, log })
    if (interceptorResult === 'DISCARD') {
        await job.moveToCompleted(null, token, false)
        return tryDequeue(worker, queueName, log)
    }
    if (interceptorResult !== null) {
        await job.moveToDelayed(Date.now() + interceptorResult.delayInMs, token)
        if (interceptorResult.priority !== undefined) {
            await job.changePriority({ priority: interceptorResult.priority })
        }
        return tryDequeue(worker, queueName, log)  // retry getNextJob instead of returning null
    }

    const engineToken = await accessTokenManager(log).generateEngineToken({
        jobId,
        projectId: migratedData.projectId as string,
        platformId: migratedData.platformId,
    })

    return {
        jobId,
        jobData: migratedData,
        attempsStarted: job.attemptsMade,
        engineToken,
        token,
        queueName,
    }
}

async function returnJobToQueue(jobId: string, token: string, queueName: string, log: FastifyBaseLogger): Promise<void> {
    const job = await fetchJobFromRedis(queueName, jobId, log)
    if (isNil(job)) {
        return
    }
    const jobData = JobData.parse(job.data)
    await job.moveToDelayed(Date.now() + 100, token)
    for (const interceptor of interceptors) {
        const { error } = await tryCatch(() => interceptor.onJobFinished({ jobId, jobData, failed: false, log }))
        if (error) {
            log.error({ job: { id: jobId }, error: String(error) }, '[jobBroker#returnJobToQueue] interceptor cleanup failed')
        }
    }
    log.info({ job: { id: jobId } }, '[jobBroker#returnJobToQueue] orphaned job returned to queue')
}

async function runInterceptors({ jobId, jobData, job, log }: { jobId: string, jobData: JobData, job: Job, log: FastifyBaseLogger }): Promise<{ delayInMs: number, priority?: number } | 'DISCARD' | null> {
    const passed: JobInterceptor[] = []
    for (const interceptor of interceptors) {
        const result = await interceptor.preDispatch({ jobId, jobData, job, log })
        if (result.verdict === InterceptorVerdict.DISCARD) {
            for (const passedInterceptor of passed) {
                const { error } = await tryCatch(() => passedInterceptor.onJobFinished({ jobId, jobData, failed: false, log }))
                if (error) {
                    log.error({ job: { id: jobId }, error: String(error) }, '[jobBroker] Failed to clean up interceptor on discard')
                }
            }
            return 'DISCARD'
        }
        if (result.verdict === InterceptorVerdict.REJECT) {
            for (const passedInterceptor of passed) {
                const { error } = await tryCatch(() => passedInterceptor.onJobFinished({ jobId, jobData, failed: false, log }))
                if (error) {
                    log.error({ job: { id: jobId }, error: String(error) }, '[jobBroker] Failed to clean up interceptor on reject')
                }
            }
            return { delayInMs: result.delayInMs, priority: result.priority }
        }
        passed.push(interceptor)
    }
    return null
}

function buildFailedReason(errorMessage: string, logs?: string): string {
    if (!logs) return errorMessage
    return `${errorMessage}\n${logs}`
}

export { tryDequeue }

export const jobBroker = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        await ensureBullMQWorker(QueueName.WORKER_JOBS, log)
        log.info('[jobBroker] Job broker initialized')
    },

    async poll(queueName: string = QueueName.WORKER_JOBS, connectionId?: string): Promise<ConsumeJobRequest | null> {
        const worker = await ensureBullMQWorker(queueName, log)
        const dispatcher = ensureDispatcher(queueName, worker, log)
        const job = await dispatcher.poll()
        if (!isNil(job) && !isNil(connectionId)) {
            jobAssignmentTracker.record({ connectionId, jobId: job.jobId, token: job.token, queueName: job.queueName })
        }
        return job
    },

    async releaseConnectionJobs(connectionId: string): Promise<void> {
        const jobs = jobAssignmentTracker.takeByConnection(connectionId)
        if (jobs.length === 0) {
            return
        }
        log.info({ connection: { id: connectionId }, jobCount: jobs.length }, '[jobBroker] Worker connection closed with in-flight jobs — returning them to the queue')
        for (const { jobId, token, queueName } of jobs) {
            const { error } = await tryCatch(() => returnJobToQueue(jobId, token, queueName, log))
            if (error) {
                log.error({ connection: { id: connectionId }, job: { id: jobId }, error: String(error) }, '[jobBroker] Failed to return in-flight job on disconnect — leaving for stalled-scan recovery')
            }
        }
    },

    async completeJob(input: ConsumeJobResponse & { jobId: string, token: string, queueName: string }): Promise<void> {
        const job = await fetchJobFromRedis(input.queueName, input.jobId, log)
        if (isNil(job)) {
            return
        }

        const jobData = JobData.parse(job.data)
        const userJobData = isUserInteractionJobData(jobData) ? jobData : null

        const { error } = await tryCatch(async () => {
            if (input.status === EngineResponseStatus.INTERNAL_ERROR) {
                if (userJobData) {
                    // User-interaction jobs (piece-metadata extraction, validation, property/auth, trigger
                    // hooks) are synchronous request/response — the caller awaits the result with a timeout.
                    // Return the error to that caller and COMPLETE the job instead of moving it to failed: the
                    // exponential-backoff retry only fires long after the caller has timed out, so it serves no
                    // one and just piles up dead jobs in the failed queue.
                    await engineResponseWatcher(log).publish(userJobData.webserverId, userJobData.requestId, {
                        status: EngineResponseStatus.INTERNAL_ERROR,
                        response: undefined,
                        error: input.errorMessage ?? 'Internal error',
                        logs: input.logs,
                    })
                    await job.moveToCompleted({ response: undefined }, input.token, false)
                    return
                }
                await job.moveToFailed(new Error(buildFailedReason(input.errorMessage ?? 'Internal error', input.logs)), input.token)
                return
            }

            await job.moveToCompleted({ response: input.response ?? undefined }, input.token, false)
            if (userJobData) {
                await engineResponseWatcher(log).publish(userJobData.webserverId, userJobData.requestId, {
                    status: input.status,
                    response: input.response,
                    error: input.errorMessage,
                    logs: input.logs,
                })
            }
        })
        if (error) {
            log.error({ job: { id: input.jobId }, error: String(error), originalError: input.errorMessage }, '[jobBroker] Failed to move job to final state — leaving for stalled-scan recovery')
            if (userJobData) {
                await engineResponseWatcher(log).publish(userJobData.webserverId, userJobData.requestId, {
                    status: EngineResponseStatus.INTERNAL_ERROR,
                    response: undefined,
                    error: String(error),
                })
            }
        }

        jobAssignmentTracker.clear({ jobId: input.jobId, queueName: input.queueName })

        const failed = input.status === EngineResponseStatus.INTERNAL_ERROR || !isNil(error)
        for (const interceptor of interceptors) {
            const { error: interceptorError } = await tryCatch(() => interceptor.onJobFinished({ jobId: input.jobId, jobData, failed, log }))
            if (interceptorError) {
                log.error({ job: { id: input.jobId }, error: String(interceptorError) }, '[jobBroker] Interceptor onJobFinished failed')
            }
        }
    },

    async extendLock(input: { jobId: string, token: string, queueName: string }): Promise<void> {
        const job = await fetchJobFromRedis(input.queueName, input.jobId, log)
        if (isNil(job)) {
            return
        }
        await job.extendLock(input.token, LOCK_DURATION_MS)
        log.debug({ job: { id: input.jobId } }, '[jobBroker] Lock extended')
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
    },
})
