import { AppSystemProp, QueueName } from '@activepieces/server-shared'
import { ApId, isNil } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { createRedisClient } from '../../database/redis-connection'
import { apDayjsDuration } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { machineService } from '../machine/machine-service'
import { AddJobParams, getDefaultJobPriority, JOB_PRIORITY, JobType, QueueManager } from '../queue/queue-manager'
import { RATE_LIMIT_WORKER_JOB_TYPES, redisRateLimiter } from './redis-rate-limiter'

const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const REDIS_FAILED_JOB_RETENTION_DAYS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds()
const REDIS_FAILED_JOB_RETRY_COUNT = system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT)

export const bullMqGroups: Record<string, Queue> = {}

export const redisQueue = (log: FastifyBaseLogger): QueueManager => ({
    async setConcurrency(queueName: QueueName, concurrency: number): Promise<void> {
        const queue = await ensureQueueExists(queueName)
        await queue.setGlobalConcurrency(concurrency)
    },
    async init(): Promise<void> {
        await redisRateLimiter(log).init()
        const queues = Object.values(QueueName).map((queueName) => ensureQueueExists(queueName))
        await Promise.all(queues)
        await machineService(log).updateConcurrency()
        log.info('[redisQueueManager#init] Redis queues initialized')
    },
    async add(params: AddJobParams<JobType>): Promise<void> {
        const { data, type } = params

        if (RATE_LIMIT_WORKER_JOB_TYPES.includes(data.jobType)) {
            const { shouldRateLimit } = await redisRateLimiter(log).shouldBeLimited(data.projectId, params.id)
            if (shouldRateLimit) {
                await redisRateLimiter(log).rateLimitJob(params)
                return
            }
        }

        const queue = await ensureQueueExists(QueueName.WORKER_JOBS)

        switch (type) {
            case JobType.REPEATING: {
                await queue.upsertJobScheduler(data.flowVersionId, {
                    pattern: params.scheduleOptions.cronExpression,
                    tz: params.scheduleOptions.timezone,
                }, {
                    name: data.flowVersionId,
                    data,
                    opts: {
                        priority: JOB_PRIORITY[params.priority ?? getDefaultJobPriority(data)],
                    },
                })
                break
            }
            case JobType.ONE_TIME: {
                await queue.add(params.id, data, {
                    priority: JOB_PRIORITY[params.priority ?? getDefaultJobPriority(data)],
                    delay: params.delay,
                    jobId: params.id,
                })
                break
            }
        }
    },
    async removeRepeatingJob({ flowVersionId }: { flowVersionId: ApId }): Promise<void> {
        const queue = await ensureQueueExists(QueueName.WORKER_JOBS)
        log.info({
            flowVersionId,
        }, '[redisQueue#removeRepeatingJob] removing the jobs')
        await queue.removeJobScheduler(flowVersionId)
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
            defaultJobOptions: {
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
            },

        },
    )
    await bullMqGroups[queueName].waitUntilReady()
    return bullMqGroups[queueName]
}

