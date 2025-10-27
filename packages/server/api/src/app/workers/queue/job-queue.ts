import { apDayjsDuration, AppSystemProp, getPlatformQueueName, memoryLock, QueueName } from '@activepieces/server-shared'
import { ApId, getDefaultJobPriority, isNil, JOB_PRIORITY } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { dedicatedWorkers } from '../../ee/platform/platform-plan/platform-dedicated-workers'
import { system } from '../../helper/system/system'
import { AddJobParams, JobType } from './queue-manager'

const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const REDIS_FAILED_JOB_RETENTION_DAYS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds()
const REDIS_FAILED_JOB_RETRY_COUNT = system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT)

const dedicatedWorkersQueues = new Map<string, Queue>()

export const jobQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const platformIdsWithDedicatedWorkers = await dedicatedWorkers(log).getPlatformIds()

        await Promise.all([
            ...platformIdsWithDedicatedWorkers.map(async (platformId) => {
                const queueName = await getQueueName(platformId, log)
                const queue = await ensureQueueExists({ log, queueName })
                dedicatedWorkersQueues.set(queueName, queue)
            }),
            ensureQueueExists({ log, queueName: QueueName.WORKER_JOBS }),
        ])

        log.info('[jobQueue#init] Dynamic queue system initialized')
    },

    async add(params: AddJobParams<JobType>): Promise<void> {
        const { type, data } = params

        const platformId = data.platformId
        const queueName = await getQueueName(platformId, log)
        const queue = await ensureQueueExists({ log, queueName })

        switch (type) {
            case JobType.REPEATING: {
                await queue.upsertJobScheduler(data.flowVersionId, {
                    pattern: params.scheduleOptions.cronExpression,
                    tz: params.scheduleOptions.timezone,
                }, {
                    name: data.flowVersionId,
                    data,
                    opts: {
                        priority: JOB_PRIORITY[getDefaultJobPriority(data)],
                    },
                })
                break
            }
            case JobType.ONE_TIME: {
                await queue.add(params.id, data, {
                    priority: JOB_PRIORITY[getDefaultJobPriority(data)],
                    delay: params.delay,
                    jobId: params.id,
                })
                break
            }
        }
    },

    async removeRepeatingJob({ flowVersionId }: { flowVersionId: ApId }): Promise<void> {
        const allQueues = [...dedicatedWorkersQueues.values()].filter(queue => !isNil(queue))

        await Promise.allSettled(
            allQueues.map(queue => queue.removeJobScheduler(flowVersionId)),
        )

        log.info({
            flowVersionId,
        }, '[jobQueue#removeRepeatingJob] removed jobs from all queues')
    },

    getAllQueues(): Queue[] {
        const queues = [...dedicatedWorkersQueues.values()].filter(queue => !isNil(queue))
        return queues
    },

    getSharedQueue(): Queue {
        const queue = dedicatedWorkersQueues.get(QueueName.WORKER_JOBS)
        if (isNil(queue)) {
            throw Error('Shared queue not initialized')
        }
        return queue
    },
    async close(): Promise<void> {
        log.info('[jobQueue#close] Closing job queue')
        const allQueues = [...dedicatedWorkersQueues.values()].filter(queue => !isNil(queue))
        await Promise.allSettled(
            allQueues.map(queue => queue.close()),
        )
    },
})

async function ensureQueueExists({ log, queueName }: { log: FastifyBaseLogger, queueName: string }): Promise<Queue> {
    const existingQueue = dedicatedWorkersQueues.get(queueName)
    if (!isNil(existingQueue)) {
        return existingQueue
    }
    return memoryLock.runExclusive({
        key: `ensure_queue_exists_${queueName}`,
        fn: async () => {
            const existingQueue = dedicatedWorkersQueues.get(queueName)
            if (!isNil(existingQueue)) {
                return existingQueue
            }

            const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
            const queue = new Queue(queueName, {
                telemetry: isOtpEnabled ? new BullMQOtel(queueName) : undefined,
                connection: await redisConnections.create(),
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
            })

            await queue.removeGlobalConcurrency()
            await queue.waitUntilReady()

            dedicatedWorkersQueues.set(queueName, queue)

            log.info({
                queueName,
            }, '[jobQueue#ensureQueueExists] Queue created')

            return queue    
        },
    })
}

async function getQueueName(platformId: string | null, log: FastifyBaseLogger): Promise<string> {
    if (!platformId) {
        return QueueName.WORKER_JOBS
    }

    const isDedicatedWorkersEnabled = await dedicatedWorkers(log).isEnabledForPlatform(platformId)
    return isDedicatedWorkersEnabled ? getPlatformQueueName(platformId) : QueueName.WORKER_JOBS
}


