import { memoryLock } from '@activepieces/server-utils'
import { ConsumeJobRequest, ConsumeJobResponse, ConsumeJobResponseStatus, isNil } from '@activepieces/shared'
import { Worker as BullMQWorker, Job } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { getPlatformQueueName, QueueName } from '../job'
import { jobMigrations } from '../migrations/job-data-migrations'

const DRAIN_DELAY_SECONDS = 30

const workerPromises = new Map<string, Promise<BullMQWorker>>()
const activeJobs = new Map<string, { job: Job, token: string }>()

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
            drainDelay: DRAIN_DELAY_SECONDS,
        },
    )
    await worker.waitUntilReady()

    log.info({ queueName }, '[jobBroker] BullMQ worker initialized')
    return worker
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
        await ensureBullMQWorker(QueueName.WORKER_JOBS, log)
        log.info('[jobBroker] Job broker initialized')
    },

    async poll(platformId?: string): Promise<ConsumeJobRequest | null> {
        const queueName = platformId ? getPlatformQueueName(platformId) : QueueName.WORKER_JOBS
        const worker = await ensureBullMQWorker(queueName, log)
        let result: ConsumeJobRequest | null = null
        try {
            const lock = await memoryLock.acquire(`job-broker-poll-${queueName}`, DRAIN_DELAY_SECONDS * 1000)
            try {
                result = await tryDequeue(worker, queueName, log)
            }
            finally {
                await lock.release()
            }
        }
        catch (e) {
            if (memoryLock.isTimeoutError(e)) {
                return null
            }
            throw e
        }
        return result
    },

    async completeJob(input: ConsumeJobResponse & { jobId: string }): Promise<void> {
        const entry = activeJobs.get(input.jobId)
        if (!entry) {
            log.warn({ jobId: input.jobId }, '[jobBroker] completeJob called for unknown job')
            return
        }

        const { job, token } = entry

        try {
            if (input.delayInSeconds && input.delayInSeconds > 0) {
                await job.moveToDelayed(Date.now() + input.delayInSeconds * 1000, token)
                return
            }

            if (input.status === ConsumeJobResponseStatus.INTERNAL_ERROR) {
                await job.moveToFailed(new Error(input.errorMessage ?? 'Internal error'), token)
                return
            }

            await job.moveToCompleted({ response: input.response ?? undefined }, token, false)
        }
        catch (error) {
            log.error({ jobId: input.jobId, error: String(error) }, '[jobBroker] Failed to move job to final state')
        }
        finally {
            activeJobs.delete(input.jobId)
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
