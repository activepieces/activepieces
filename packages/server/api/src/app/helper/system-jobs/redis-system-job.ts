import { Job, JobsOptions, Queue, Worker } from 'bullmq'
import dayjs from 'dayjs'
import { createRedisClient } from '../../database/redis-connection'
import { JobSchedule, SystemJobData, SystemJobDefinition, SystemJobHandler, SystemJobName, SystemJobSchedule } from './common'
import { logger } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'

const FIFTEEN_MINUTES = 15 * 60 * 1000
const SYSTEM_JOB_QUEUE = 'system-job-queue'

const jobHandlers = new Map<SystemJobName, SystemJobHandler>()

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

                const jobHandler = getJobHandlerOrThrow(job.name)
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

    async upsertJob({ job, schedule, handler }): Promise<void> {
        logger.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Upserting job')
        if (await jobNotInQueue(job.name)) {
            logger.info({ name: 'RedisSystemJob#upsertJob', jobName: job.name }, 'Adding job to queue')
            await addJobToQueue({
                job,
                schedule,
            })
        }

        setJobHandler({
            name: job.name,
            handler,
        })
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
    const jobOptions = configureJobOptions(schedule)
    await systemJobsQueue.add(job.name, job.data, jobOptions)
}

const configureJobOptions = (schedule: JobSchedule): JobsOptions => {
    switch (schedule.type) {
        case 'one-time': {
            const now = dayjs()
            return {
                delay: schedule.date.diff(now, 'milliseconds'),
            }
        }

        case 'repeated': {
            return {
                repeat: {
                    pattern: schedule.cron,
                    tz: 'UTC',
                },
            }
        }
    }
}

const setJobHandler = <T extends SystemJobName>({ name, handler }: SetJobHandlerParams<T>): void => {
    logger.info({ name: 'RedisSystemJob#setJobHandler', jobName: name }, 'Setting job handler')
    jobHandlers.set(name, handler)
}


const getJobHandlerOrThrow = (name: string): SystemJobHandler => {
    const jobHandler = jobHandlers.get(name as SystemJobName)

    if (isNil(jobHandler)) {
        throw new Error(`No handler for job ${name}`)
    }

    return jobHandler
}

const jobNotInQueue = async (name: SystemJobName): Promise<boolean> => {
    const job = await getJobByName(name)
    return isNil(job)
}

const getJobByName = async <T extends SystemJobName>(name: T): Promise<SystemJob<T> | undefined> => {
    const allSystemJobs = await systemJobsQueue.getJobs()
    return allSystemJobs.find(job => job.name === name) as SystemJob<T> | undefined
}

type SystemJob<T extends SystemJobName> = Job<SystemJobData<T>, unknown>

type AddJobToQueueParams<T extends SystemJobName> = {
    job: SystemJobDefinition<T>
    schedule: JobSchedule
}

type SetJobHandlerParams<T extends SystemJobName> = {
    name: T
    handler: SystemJobHandler<T>
}
