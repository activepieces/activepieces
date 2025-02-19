import { isNil, spreadIfDefined } from '@activepieces/shared'
import { Job, JobsOptions, Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { createRedisClient } from '../../database/redis-connection'
import { apDayjs, apDayjsDuration } from '../dayjs-helper'
import { JobSchedule, SystemJobData, SystemJobName, SystemJobSchedule } from './common'
import { systemJobHandlers } from './job-handlers'

const FIFTEEN_MINUTES = apDayjsDuration(15, 'minute').asMilliseconds()
const ONE_MONTH = apDayjsDuration(1, 'month').asMilliseconds()
const SYSTEM_JOB_QUEUE = 'system-job-queue'

export let systemJobsQueue: Queue<SystemJobData, unknown, SystemJobName>
let systemJobWorker: Worker<SystemJobData, unknown, SystemJobName>

export const redisSystemJobSchedulerService = (log: FastifyBaseLogger): SystemJobSchedule => ({
    async init(): Promise<void> {
        systemJobsQueue = new Queue(
            SYSTEM_JOB_QUEUE,
            {
                connection: createRedisClient(),
                defaultJobOptions: {
                    attempts: 10,
                    backoff: {
                        type: 'exponential',
                        delay: FIFTEEN_MINUTES,
                    },
                    removeOnComplete: true,
                    removeOnFail: {
                        age: ONE_MONTH,
                    },
                },
            },
        )

        systemJobWorker = new Worker(
            SYSTEM_JOB_QUEUE,
            async (job) => {
                log.debug({ name: 'RedisSystemJob#systemJobWorker' }, `Executing job (${job.name})`)

                const jobHandler = systemJobHandlers.getJobHandler(job.name)
                await jobHandler(job.data)
            },
            {
                connection: createRedisClient(),
                concurrency: 1,
            },
        )

        await Promise.all([
            systemJobsQueue.waitUntilReady(),
            systemJobWorker.waitUntilReady(),
        ])
        await removeDeprecatedJobs()
    },

    async upsertJob({ job, schedule }): Promise<void> {
        log.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Upserting job')
        const existingJob = await getJobByNameAndJobId(job.name, job.jobId)

        const patternChanged = !isNil(existingJob) && schedule.type === 'repeated' ? schedule.cron !== existingJob.opts.repeat?.pattern : false

        if (patternChanged && !isNil(existingJob) && !isNil(existingJob.opts.repeat) && !isNil(existingJob.name)) {
            log.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Pattern changed, removing job from queue')
            await systemJobsQueue.removeRepeatable(existingJob.name as SystemJobName, existingJob.opts.repeat)
        }
        if (isNil(existingJob) || patternChanged) {
            log.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Adding job to queue')
            const jobOptions = configureJobOptions({ schedule, jobId: job.jobId })
            await systemJobsQueue.add(job.name, job.data, jobOptions)
            return
        }
    },

    async close(): Promise<void> {
        if (isNil(systemJobsQueue)) {
            return
        }

        await Promise.all([
            systemJobWorker.close(),
            systemJobsQueue.close(),
        ])
    },
})


async function removeDeprecatedJobs() {
    const deprecatedJobs = [
        'trigger-data-cleaner',
        'logs-cleanup-trigger',
    ]
    const allSystemJobs = await systemJobsQueue.getJobSchedulers()
    const deprecatedJobsFromQueue = allSystemJobs.filter(f => !isNil(f) && deprecatedJobs.includes(f.name))
    for (const job of deprecatedJobsFromQueue) {
        await systemJobsQueue.removeJobScheduler(job.key)
    }
}

const configureJobOptions = ({ schedule, jobId }: { schedule: JobSchedule, jobId?: string }): JobsOptions => {
    const config: JobsOptions = {}

    switch (schedule.type) {
        case 'one-time': {
            const now = apDayjs()
            config.delay = schedule.date.diff(now, 'milliseconds')
            break
        }
        case 'repeated': {
            config.repeat = {
                pattern: schedule.cron,
                tz: 'UTC',
            }
            break
        }
    }

    return {
        ...config,
        ...spreadIfDefined('jobId', jobId),
    }
}

const getJobByNameAndJobId = async (name: string, jobId?: string): Promise<Job | undefined> => {
    const allSystemJobs = await systemJobsQueue.getJobs()
    return allSystemJobs.find(job => jobId ? (job.name === name && job.id === jobId) : job.name === name)
}
