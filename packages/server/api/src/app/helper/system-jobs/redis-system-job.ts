import { logger } from '@activepieces/server-shared'
import { isNil, spreadIfDefined } from '@activepieces/shared'
import { Job, JobsOptions, Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'
import { createRedisClient } from '../../database/redis-connection'
import { JobSchedule, SystemJobData, SystemJobName, SystemJobSchedule } from './common'
import { systemJobHandlers } from './job-handlers'

const FIFTEEN_MINUTES = 15 * 60 * 1000
const SYSTEM_JOB_QUEUE = 'system-job-queue'

export let systemJobsQueue: Queue<SystemJobData, unknown, SystemJobName>
let systemJobWorker: Worker<SystemJobData, unknown, SystemJobName>

export const redisSystemJobSchedulerService: SystemJobSchedule = {
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
                },
            },
        )

        systemJobWorker = new Worker(
            SYSTEM_JOB_QUEUE,
            async (job) => {
                logger.debug({ name: 'RedisSystemJob#systemJobWorker' }, `Executing job (${job.name})`)

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
        logger.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Upserting job')
        const existingJob = await getJobByNameAndJobId(job.name, job.jobId)

        const patternChanged = !isNil(existingJob) && schedule.type === 'repeated' ? schedule.cron !== existingJob.opts.repeat?.pattern : false

        if (patternChanged && !isNil(existingJob) && !isNil(existingJob.opts.repeat) && !isNil(existingJob.name)) {
            logger.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Pattern changed, removing job from queue')
            await systemJobsQueue.removeRepeatable(existingJob.name as SystemJobName, existingJob.opts.repeat)
        }
        if (isNil(existingJob) || patternChanged) {
            logger.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Adding job to queue')
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
}


async function removeDeprecatedJobs() {
    const deprecatedJobs = [
        'trigger-data-cleaner',
        'logs-cleanup-trigger',
    ]
    for (const jobName of deprecatedJobs) {
        const job = await getJobByNameAndJobId(jobName)
        if (isNil(job)) {
            continue
        }
        if (!isNil(job.repeatJobKey)) {
            await systemJobsQueue.removeRepeatableByKey(job.repeatJobKey!)
        }
    }
}

const configureJobOptions = ({ schedule, jobId }: { schedule: JobSchedule, jobId?: string }): JobsOptions => {
    const config: JobsOptions = {}

    switch (schedule.type) {
        case 'one-time': {
            const now = dayjs()
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
