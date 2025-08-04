import { AppSystemProp, exceptionHandler, JobType, QueueName } from '@activepieces/server-shared'
import { ActivepiecesError, ApId, ErrorCode, isNil } from '@activepieces/shared'
import { DefaultJobOptions, Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { createRedisClient } from '../../database/redis-connection'
import { apDayjsDuration } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { AddParams, JOB_PRIORITY, QueueManager } from '../queue/queue-manager'
import { redisMigrations } from './redis-migration'
import { redisRateLimiter } from './redis-rate-limiter'

const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const REDIS_FAILED_JOB_RETENTION_DAYS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds()
const REDIS_FAILED_JOB_RETRY_COUNT = system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT)

const defaultJobOptions: DefaultJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: EIGHT_MINUTES_IN_MILLISECONDS,
    },
    removeOnComplete: true,
    removeOnFail: {
        age: REDIS_FAILED_JOB_RETENTION_DAYS,
        count: REDIS_FAILED_JOB_RETRY_COUNT,
    },
}
export const bullMqGroups: Record<string, Queue> = {}
const jobTypeToDefaultJobOptions: Record<QueueName, DefaultJobOptions> = {
    [QueueName.SCHEDULED]: defaultJobOptions,
    [QueueName.ONE_TIME]: defaultJobOptions,
    [QueueName.USERS_INTERACTION]: {
        ...defaultJobOptions,
        removeOnFail: true,
        attempts: 1,
    },
    [QueueName.WEBHOOK]: {
        ...defaultJobOptions,
        attempts: 3,
    },
    [QueueName.AGENTS]: defaultJobOptions,
}

export const redisQueue = (log: FastifyBaseLogger): QueueManager => ({
    async init(): Promise<void> {
        await redisRateLimiter(log).init()
        const queues = Object.values(QueueName).map((queueName) => ensureQueueExists(queueName))
        await Promise.all(queues)
        await redisMigrations(log).run()
        log.info('[redisQueueManager#init] Redis queues initialized')
    },
    async add(params: AddParams<JobType>): Promise<void> {
        const { type, data } = params

        if (params.type === JobType.WEBHOOK || params.type === JobType.ONE_TIME) {
            const { shouldRateLimit } = await redisRateLimiter(log).shouldBeLimited(data.projectId, params.id)
            if (shouldRateLimit) {
                await redisRateLimiter(log).rateLimitJob(params)
                return
            }
        }

        switch (type) {
            case JobType.REPEATING: {
                await upsertRepeatingJob(params)
                break
            }
            case JobType.DELAYED: {
                await addDelayedJob(params)
                break
            }
            case JobType.ONE_TIME: {
                const queue = await ensureQueueExists(QueueName.ONE_TIME)
                await addJobWithPriority(queue, params)
                break
            }
            case JobType.USERS_INTERACTION: {
                const queue = await ensureQueueExists(QueueName.USERS_INTERACTION)
                await addUserInteractionJob(queue, params)
                break
            }
            case JobType.WEBHOOK: {
                const queue = await ensureQueueExists(QueueName.WEBHOOK)
                await addJobWithPriority(queue, params)
                break
            }
            case JobType.AGENTS: {
                const queue = await ensureQueueExists(QueueName.AGENTS)
                await addJobWithPriority(queue, params)
                break
            }
        }
    },
    async removeRepeatingJob({ flowVersionId }: { flowVersionId: ApId }): Promise<void> {
        const queue = await ensureQueueExists(QueueName.SCHEDULED)
        log.info({
            flowVersionId,
        }, '[redisQueue#removeRepeatingJob] removing the jobs')
        const hasScheduledJob = await queue.getJobScheduler(flowVersionId)
        if (isNil(hasScheduledJob)) {
            return
        }
        const result = await queue.removeJobScheduler(flowVersionId)
        if (!result) {
            exceptionHandler.handle(new ActivepiecesError({
                code: ErrorCode.JOB_REMOVAL_FAILURE,
                params: {
                    flowVersionId,
                },
            }), log)
        }
    },

})

async function ensureQueueExists(queueName: QueueName): Promise<Queue> {
    if (!isNil(bullMqGroups[queueName])) {
        return bullMqGroups[queueName]
    }
    const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
    bullMqGroups[queueName] = new Queue(
        queueName,
        {
            telemetry: isOtpEnabled ? new BullMQOtel(queueName) : undefined,
            connection: createRedisClient(),
            defaultJobOptions: jobTypeToDefaultJobOptions[queueName],
        },
    )
    await bullMqGroups[queueName].waitUntilReady()
    return bullMqGroups[queueName]
}

async function addJobWithPriority(queue: Queue, params: AddParams<JobType.WEBHOOK | JobType.ONE_TIME | JobType.AGENTS>): Promise<void> {
    const { id, data, priority } = params
    await queue.add(id, data, {
        jobId: id,
        priority: JOB_PRIORITY[priority],
    })
}

async function addDelayedJob(params: AddParams<JobType.DELAYED>): Promise<void> {
    const { id, data, delay } = params
    const queue = await ensureQueueExists(QueueName.SCHEDULED)
    await queue.add(id, data, {
        jobId: id,
        delay,
    })
}

async function addUserInteractionJob(queue: Queue, params: AddParams<JobType.USERS_INTERACTION>): Promise<void> {
    const { id, data } = params
    await queue.add(id, data)
}

async function upsertRepeatingJob(params: AddParams<JobType.REPEATING>): Promise<void> {
    const { data, scheduleOptions } = params
    const queue = await ensureQueueExists(QueueName.SCHEDULED)
    await queue.upsertJobScheduler(data.flowVersionId,
        {
            pattern: scheduleOptions.cronExpression,
            tz: scheduleOptions.timezone,
        },
        {
            name: data.flowVersionId,
            data,
        },
    )
}

