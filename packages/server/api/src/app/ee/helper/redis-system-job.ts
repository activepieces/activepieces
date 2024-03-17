import { ProjectId, isNil } from '@activepieces/shared'
import { Queue, Worker, Job, JobsOptions } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, SystemProp, logger, system } from 'server-shared'
import dayjs, { Dayjs } from 'dayjs'

const FIFTEEN_MINUTES = 15 * 60 * 1000
const SYSTEM_JOB_QUEUE = 'system-job-queue'

const QueueModeIsNotRedis = system.get(SystemProp.QUEUE_MODE) !== QueueMode.REDIS
const jobHandlers = new Map<SystemJobName, SystemJobHandler>()

let systemJobsQueue: Queue<SystemJobData, unknown, SystemJobName>
let systemJobWorker: Worker<SystemJobData, unknown, SystemJobName>

export const redisSystemJob = {
    async init(): Promise<void> {
        if (QueueModeIsNotRedis) {
            return
        }

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

    async upsertJob<T extends SystemJobName>({ job, schedule, handler }: UpsertJobParams<T>): Promise<void> {
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

type SystemJobName =
    | 'hard-delete-project'
    | 'project-usage-report'
    | 'usage-report'

type HardDeleteProjectSystemJobData = {
    projectId: ProjectId
}

type ProjectUsageReportSystemJobData = Record<string, never>
type UsageReportSystemJobData = Record<string, never>

type SystemJobData<T extends SystemJobName = SystemJobName> =
    T extends 'hard-delete-project' ? HardDeleteProjectSystemJobData :
        T extends 'project-usage-report' ? ProjectUsageReportSystemJobData :
            T extends 'usage-report' ? UsageReportSystemJobData :
                never

type SystemJobDefinition<T extends SystemJobName> = {
    name: T
    data: SystemJobData<T>
}

type SystemJobHandler<T extends SystemJobName = SystemJobName> = (data: Job<SystemJobData<T>, unknown>) => Promise<void>

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

export type SystemJob<T extends SystemJobName> = Job<SystemJobData<T>, unknown>

type AddJobToQueueParams<T extends SystemJobName> = {
    job: SystemJobDefinition<T>
    schedule: JobSchedule
}

type UpsertJobParams<T extends SystemJobName> = {
    job: SystemJobDefinition<T>
    schedule: JobSchedule
    handler: SystemJobHandler<T>
}

type SetJobHandlerParams<T extends SystemJobName> = {
    name: T
    handler: SystemJobHandler<T>
}
