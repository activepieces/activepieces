import { ApId, ProjectId, isNil } from '@activepieces/shared'
import { Queue, Worker, Job, JobsOptions } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, SystemProp, logger, system } from 'server-shared'
import dayjs, { Dayjs } from 'dayjs'

const FIFTEEN_MINUTES = 15 * 60 * 1000
const SYSTEM_JOB_QUEUE = 'system-job-queue'

const QueueModeIsNotRedis = system.get(SystemProp.QUEUE_MODE) !== QueueMode.REDIS
const jobHandlers = new Map<string, SystemJobHandler>()

let systemJobsQueue: Queue<SystemJobData, unknown>
let systemJobWorker: Worker<SystemJobData, unknown>

export const redisSystemJob = {
    async init(): Promise<void> {
        if (QueueModeIsNotRedis) {
            return
        }

        systemJobsQueue = new Queue<SystemJobData, unknown, ApId>(
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

        systemJobWorker = new Worker<SystemJobData, unknown, ApId>(
            SYSTEM_JOB_QUEUE,
            async (job) => {
                logger.debug({ name: 'RedisSystemJob#systemJobWorker' }, `Executing job (${job.name})`)

                const jobHandler = getJobHandlerOrThrow(job.name)
                await jobHandler(job)
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

    async upsertJob({ job, schedule, handler }: UpsertJobParams): Promise<void> {
        if (QueueModeIsNotRedis) {
            return
        }

        if (await jobNotInQueue(job.name)) {
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

const addJobToQueue = async ({ job, schedule }: AddJobToQueueParams): Promise<void> => {
    const jobOptions = configureJobOptions(schedule)
    await systemJobsQueue.add(job.name, job, jobOptions)
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

const setJobHandler = ({ name, handler }: SetJobHandlerParams): void => {
    jobHandlers.set(name, handler)
}

const getJobHandlerOrThrow = (name: string): SystemJobHandler => {
    const jobHandler = jobHandlers.get(name)

    if (isNil(jobHandler)) {
        throw new Error(`No handler for job ${name}`)
    }

    return jobHandler
}

const jobNotInQueue = async (name: SystemJobName): Promise<boolean> => {
    const job = await getJobByName(name)
    return isNil(job)
}

const getJobByName = async (name: SystemJobName): Promise<Job<SystemJobData, unknown> | undefined> => {
    const allSystemJobs = await systemJobsQueue.getJobs()
    return allSystemJobs.find(job => job.data.name === name)
}

type SystemJobName =
    | 'hard-delete-project'
    | 'project-usage-report'
    | 'usage-report'

type BaseSystemJobData<Name extends SystemJobName, Data extends Record<string, unknown>> = {
    name: Name
    data: Data
}

type HardDeleteProjectSystemJobData = BaseSystemJobData<'hard-delete-project', {
    projectId: ProjectId
}>

type ProjectUsageReportSystemJobData = BaseSystemJobData<'project-usage-report', Record<string, never>>
type UsageReportSystemJobData = BaseSystemJobData<'usage-report', Record<string, never>>

type SystemJobData =
    | HardDeleteProjectSystemJobData
    | ProjectUsageReportSystemJobData
    | UsageReportSystemJobData

type SystemJobHandler = (data: Job<SystemJobData, unknown>) => Promise<void>

type OneTimeJobSchedule = {
    type: 'one-time'
    date: Dayjs
}

type RepeatedJobSchedule = {
    type: 'repeated'
    cron: string
}

type JobSchedule =
    | OneTimeJobSchedule
    | RepeatedJobSchedule

type AddJobToQueueParams = {
    job: SystemJobData
    schedule: JobSchedule
}

type UpsertJobParams = {
    job: SystemJobData
    schedule: JobSchedule
    handler: SystemJobHandler
}

type SetJobHandlerParams = {
    name: SystemJobName
    handler: SystemJobHandler
}
