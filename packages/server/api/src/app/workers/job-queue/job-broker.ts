import { ConsumeJobRequest, ConsumeJobResponse, ConsumeJobResponseStatus, ExecutionType, JobData, tryCatch } from '@activepieces/shared'
import { Worker as BullMQWorker, DelayedError, Job } from 'bullmq'
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

const WAITER_TIMEOUT_MS = 50_000

const interceptors: JobInterceptor[] = [rateLimiterInterceptor]
const workerPromises = new Map<string, Promise<BullMQWorker>>()
const waitersMap = new Map<string, Waiter[]>()
const activeJobs = new Map<string, ActiveJob>()

function getWaiters(queueName: string): Waiter[] {
    let list = waitersMap.get(queueName)
    if (!list) {
        list = []
        waitersMap.set(queueName, list)
    }
    return list
}

function addWaiter(queueName: string, waiter: Waiter): void {
    getWaiters(queueName).push(waiter)
}

function removeWaiter(queueName: string, resolve: Waiter['resolve']): void {
    const list = getWaiters(queueName)
    const idx = list.findIndex(w => w.resolve === resolve)
    if (idx !== -1) {
        list.splice(idx, 1)
    }
}

function takeWaiter(queueName: string): Waiter | undefined {
    const list = getWaiters(queueName)
    const waiter = list.shift()
    if (waiter) {
        clearTimeout(waiter.timer)
    }
    return waiter
}

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
        async (job: Job, token?: string) => {
            const migratedData = await jobMigrations(log).apply(job.data)
            const jobId = job.id ?? job.name

            // Interceptor check
            const interceptorResult = await runInterceptors({ jobId, jobData: migratedData, job, log })
            if (interceptorResult !== null) {
                await job.moveToDelayed(Date.now() + interceptorResult.delayInMs, token)
                if (interceptorResult.priority !== undefined) {
                    await job.changePriority({ priority: interceptorResult.priority })
                }
                throw new DelayedError()
            }

            // Take a waiter — if none available, return job to queue
            // Use 2s delay to avoid tight retry loops when no workers are polling
            const waiter = takeWaiter(queueName)
            if (!waiter) {
                await job.moveToDelayed(Date.now() + 2000, token)
                throw new DelayedError()
            }

            // Hand off to external worker
            const engineToken = await accessTokenManager(log).generateEngineToken({
                jobId,
                projectId: migratedData.projectId as string,
                platformId: migratedData.platformId,
            })
            const completionPromise = new Promise<CompletionResult>((resolve) => {
                activeJobs.set(jobId, { job, token: token!, jobData: migratedData, completeResolve: resolve })
            })
            waiter.resolve({
                jobId,
                jobData: migratedData,
                engineToken,
                timeoutInSeconds: 600,
                attempsStarted: job.attemptsMade,
            })

            // Wait for external worker to call completeJob()
            const result = await completionPromise
            activeJobs.delete(jobId)

            // Interceptor cleanup
            for (const interceptor of interceptors) {
                await tryCatch(() => interceptor.onJobFinished({ jobId, jobData: migratedData, log }))
            }

            // Let BullMQ handle final job state based on what we return/throw
            if (result.delayInSeconds && result.delayInSeconds > 0) {
                await job.updateData({ ...job.data, executionType: ExecutionType.RESUME })
                await job.moveToDelayed(Date.now() + result.delayInSeconds * 1000, token)
                throw new DelayedError()
            }
            if (result.status === ConsumeJobResponseStatus.INTERNAL_ERROR) {
                throw new Error(result.errorMessage ?? 'Internal error')
            }
            return { response: result.response ?? undefined }
        },
        {
            connection: await redisConnections.create(),
            telemetry: isOtelEnabled ? new BullMQOtel(queueName) : undefined,
            concurrency: 10,
            autorun: true,
            lockDuration: 120_000,
            stalledInterval: 30_000,
            maxStalledCount: 3,
            drainDelay: 15,
        },
    )
    await worker.waitUntilReady()
    await worker.startStalledCheckTimer()

    log.info({ queueName }, '[jobBroker] BullMQ worker initialized')
    return worker
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
        await ensureBullMQWorker(queueName, log)

        return new Promise<ConsumeJobRequest | null>((resolve) => {
            const timer = setTimeout(() => {
                removeWaiter(queueName, resolve)
                resolve(null)
            }, WAITER_TIMEOUT_MS)

            addWaiter(queueName, { resolve, timer })
        })
    },

    async completeJob(input: ConsumeJobResponse & { jobId: string }): Promise<void> {
        const entry = activeJobs.get(input.jobId)
        if (!entry) {
            log.warn({ jobId: input.jobId }, '[jobBroker] completeJob called for unknown job')
            return
        }
        entry.completeResolve(input)
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
        // Resolve all pending waiters with null
        for (const [, waiters] of waitersMap) {
            for (const waiter of waiters) {
                clearTimeout(waiter.timer)
                waiter.resolve(null)
            }
        }
        waitersMap.clear()

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

type Waiter = {
    resolve: (value: ConsumeJobRequest | null) => void
    timer: ReturnType<typeof setTimeout>
}

type ActiveJob = {
    job: Job
    token: string
    jobData: JobData
    completeResolve: (result: CompletionResult) => void
}

type CompletionResult = ConsumeJobResponse & { jobId: string }
