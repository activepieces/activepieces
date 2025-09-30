import { AppSystemProp, QueueName } from '@activepieces/server-shared'
import { ApId, isNil } from '@activepieces/shared'
import { Queue, QueueEvents } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis'
import { apDayjsDuration } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { machineService } from '../machine/machine-service'
import { AddJobParams, getDefaultJobPriority, JOB_PRIORITY, JobType, QueueManager, RATE_LIMIT_PRIORITY } from './queue-manager'
import { workerJobRateLimiter } from './worker-job-rate-limiter'
import { saveQueueMetrics } from './queue-events/save-queue-metrics'
import { EventsTypeHandlerMapper, EventsHandlerType } from './queue-events/events-manager'

const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const REDIS_FAILED_JOB_RETENTION_DAYS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds()
const REDIS_FAILED_JOB_RETRY_COUNT = system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT)

export const bullMqGroups: Record<string, {queue: Queue, queueEvents: QueueEvents}> = {}
// export const bullMqEventsGroups: Record<string, QueueEvents> = {}

export const jobQueue = (log: FastifyBaseLogger): QueueManager => ({
    async setConcurrency(queueName: QueueName, concurrency: number): Promise<void> {
        const {queue} = await ensureQueueExists(queueName)
        await queue.setGlobalConcurrency(concurrency)
    },
    async init(): Promise<void> {
        const queues = Object.values(QueueName).map((queueName) => ensureQueueExists(queueName))
        await Promise.all(queues)
        await machineService(log).updateConcurrency()
        log.info('[redisQueueManager#init] Redis queues initialized')
    },
    async add(params: AddJobParams<JobType>): Promise<void> {
        const { data, type } = params

        const { shouldRateLimit } = await workerJobRateLimiter(log).shouldBeLimited(params.id, data)
        const {queue} = await ensureQueueExists(QueueName.WORKER_JOBS)

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
                    priority: shouldRateLimit ? JOB_PRIORITY[RATE_LIMIT_PRIORITY] : JOB_PRIORITY[params.priority ?? getDefaultJobPriority(data)],
                    delay: params.delay,
                    jobId: params.id,
                })
                break
            }
        }
    },
    async removeRepeatingJob({ flowVersionId }: { flowVersionId: ApId }): Promise<void> {
        const {queue} = await ensureQueueExists(QueueName.WORKER_JOBS)
        log.info({
            flowVersionId,
        }, '[redisQueue#removeRepeatingJob] removing the jobs')
        await queue.removeJobScheduler(flowVersionId)
    },
    async addEventsHandler(queueName: QueueName, handlerType: EventsHandlerType): Promise<void> {
        const { queueEvents } = await ensureQueueExists(queueName)
        const handler = EventsTypeHandlerMapper[handlerType]
        await handler(log, queueEvents).attach()
    },
    async removeEventsHandler(queueName: QueueName, handlerType: EventsHandlerType): Promise<void> {
        const { queueEvents } = await ensureQueueExists(queueName)
        const handler = EventsTypeHandlerMapper[handlerType]
        await handler(log, queueEvents).detach()
    }
})

async function ensureQueueExists(queueName: QueueName): Promise<{queue: Queue, queueEvents: QueueEvents}> {
    if (!isNil(bullMqGroups[queueName])) {
        return bullMqGroups[queueName]
    }
    const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)

    const options = {
        telemetry: isOtpEnabled ? new BullMQOtel(queueName) : undefined,
        connection: await redisConnections.createNew(),
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

    }

    bullMqGroups[queueName] = {queue: new Queue(queueName, options), queueEvents: new QueueEvents(queueName, options)}
    
    await bullMqGroups[queueName].queue.waitUntilReady()
    await bullMqGroups[queueName].queueEvents.waitUntilReady()


    return bullMqGroups[queueName]
}

