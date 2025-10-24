import { apDayjsDuration, AppSystemProp, QueueName } from '@activepieces/server-shared'
import { ApId, getDefaultJobPriority, isNil, JOB_PRIORITY } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AddJobParams, JobType } from './queue-manager'


const EIGHT_MINUTES_IN_MILLISECONDS = apDayjsDuration(8, 'minute').asMilliseconds()
const REDIS_FAILED_JOB_RETENTION_DAYS = apDayjsDuration(system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS), 'day').asSeconds()
const REDIS_FAILED_JOB_RETRY_COUNT = system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT)

export let workerJobsQueue: Queue | undefined = undefined

export const jobQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        await ensureWorkerQueueExists()
        log.info('[jobQueue#init] Job queue initialized')
    },
    async add(params: AddJobParams<JobType>): Promise<void> {
        const { type, data } = params

        const queue = await ensureWorkerQueueExists()

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
        const queue = await ensureWorkerQueueExists()
        log.info({
            flowVersionId,
        }, '[redisQueue#removeRepeatingJob] removing the jobs')
        await queue.removeJobScheduler(flowVersionId)
    },
    async close(): Promise<void> {
        log.info('[jobQueue#close] Closing job queue')
     
        if (workerJobsQueue) {
            await workerJobsQueue.close()
        }
    },
})

async function ensureWorkerQueueExists(): Promise<Queue> {
    if (!isNil(workerJobsQueue)) {
        return workerJobsQueue
    }
    const isOtpEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)

    const options = {
        telemetry: isOtpEnabled ? new BullMQOtel(QueueName.WORKER_JOBS) : undefined,
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

    }

    workerJobsQueue = new Queue(QueueName.WORKER_JOBS, options)
    await workerJobsQueue.removeGlobalConcurrency()
    await workerJobsQueue.waitUntilReady()

    return workerJobsQueue
}

