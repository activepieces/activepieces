import {
    AppSystemProp,
    getThrottledJobsQueueName,
    memoryLock,
    QueueName
} from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { dedicatedWorkers } from '../../ee/platform/platform-plan/platform-dedicated-workers'
import { system } from '../../helper/system/system'
import { AddJobParams, JobType } from './queue-manager'

const dedicatedWorkersQueues = new Map<string, Queue>()

export const throttledJobQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const platformIdsWithDedicatedWorkers = await dedicatedWorkers(log).getPlatformIds()

        await Promise.all([
            ...platformIdsWithDedicatedWorkers.map(async (platformId) => {
                const queueName = await getQueueName(platformId, log)
                const queue = await ensureQueueExists({ log, queueName })
                dedicatedWorkersQueues.set(queueName, queue)
            }),
            ensureQueueExists({ log, queueName: QueueName.THROTTLED_JOBS }),
        ])

        log.info('[throttledJobQueue#init] Dynamic queue system initialized')
    },

    async add(params: Omit<AddJobParams<JobType.ONE_TIME | JobType.REPEATING>, 'type'>): Promise<void> {
        const { data } = params

        const platformId = data.platformId
        const queueName = await getQueueName(platformId, log)
        const queue = await ensureQueueExists({ log, queueName })

        await queue.add(params.id, data, { jobId: params.id })
    },

    getAllQueues(): Queue[] {
        const queues = [...dedicatedWorkersQueues.values()].filter(queue => !isNil(queue))
        return queues
    },

    getSharedQueue(): Queue {
        const queue = dedicatedWorkersQueues.get(QueueName.THROTTLED_JOBS)
        if (isNil(queue)) {
            throw Error('Shared queue not initialized')
        }
        return queue
    },
    async close(): Promise<void> {
        log.info('[throttledJobQueue#close] Closing job queue')
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
            })

            await queue.removeGlobalConcurrency()
            await queue.waitUntilReady()

            dedicatedWorkersQueues.set(queueName, queue)

            log.info({
                queueName,
            }, '[throttledJobQueue#ensureQueueExists] Queue created')

            return queue
        },
    })
}

async function getQueueName(platformId: string | null, log: FastifyBaseLogger): Promise<string> {
    if (!platformId) {
        return QueueName.THROTTLED_JOBS
    }

    const isDedicatedWorkersEnabled = await dedicatedWorkers(log).isEnabledForPlatform(platformId)
    return isDedicatedWorkersEnabled ? getThrottledJobsQueueName(platformId) : QueueName.THROTTLED_JOBS
}


