import { logger } from '@activepieces/server-shared'
import { isNil, spreadIfDefined } from '@activepieces/shared'
import { Job, JobsOptions, Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'
import { createRedisClient } from '../../database/redis-connection'
import { JobSchedule, SystemJobData, SystemJobDefinition, SystemJobName, SystemJobSchedule } from './common'
import { getJobHandler } from './job-handlers'

const FIFTEEN_MINUTES = 15 * 60 * 1000
const SYSTEM_JOB_QUEUE = 'system-job-queue'

let systemJobsQueue: Queue<SystemJobData, unknown, SystemJobName>
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

                const jobHandler = getJobHandler(job.name)
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
    },

    async upsertJob({ job, schedule }): Promise<void> {
        logger.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Upserting job')
        if (await jobNotInQueue(job.name, job.jobId)) {
            logger.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Adding job to queue')
            await addJobToQueue({
                job,
                schedule,
            })
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

const addJobToQueue = async <T extends SystemJobName>({ job, schedule }: AddJobToQueueParams<T>): Promise<void> => {
    const jobOptions = configureJobOptions({ schedule, jobId: job.jobId })
    await systemJobsQueue.add(job.name, job.data, jobOptions)
}

const configureJobOptions = ({ schedule, jobId }: { schedule: JobSchedule, jobId?: string }): JobsOptions => {
    const config: JobsOptions = {}
    
    if (schedule.type === 'one-time') {
        const now = dayjs()
        config.delay = schedule.date.diff(now, 'milliseconds')
    }
    else if (schedule.type === 'repeated') {
        config.repeat = {
            pattern: schedule.cron,
            tz: 'UTC',
        }
    }

    return {
        ...config,
        ...spreadIfDefined('jobId', jobId),
    }
}

const jobNotInQueue = async (name: SystemJobName, jobId?: string): Promise<boolean> => {
    const job = await getJobByNameAndJobId(name, jobId)
    return isNil(job)
}

const getJobByNameAndJobId = async <T extends SystemJobName>(name: T, jobId?: string): Promise<SystemJob | undefined> => {
    const allSystemJobs = await systemJobsQueue.getJobs()
    return allSystemJobs.find(job => jobId ? (job.name === name && job.id === jobId) : job.name === name) as SystemJob | undefined
}

type SystemJob = Job<SystemJobData, unknown>

type AddJobToQueueParams<T extends SystemJobName> = {
    job: SystemJobDefinition<T>
    schedule: JobSchedule
}