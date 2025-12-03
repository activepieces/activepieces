import { apDayjs, apDayjsDuration } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil, spreadIfDefined, tryCatch } from '@activepieces/shared'
import { Job, JobsOptions, Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { JobSchedule, SystemJobData, SystemJobName, SystemJobSchedule } from './common'
import { systemJobHandlers } from './job-handlers'

const FIFTEEN_MINUTES = apDayjsDuration(15, 'minute').asMilliseconds()
const ONE_MONTH = apDayjsDuration(1, 'month').asSeconds()
const SYSTEM_JOB_QUEUE = 'system-job-queue'

export let systemJobsQueue: Queue<SystemJobData, unknown, SystemJobName>
let systemJobWorker: Worker<SystemJobData, unknown, SystemJobName>

export const systemJobsSchedule = (log: FastifyBaseLogger): SystemJobSchedule => ({
    async init(): Promise<void> {
        const queueConfig = {
            connection: await redisConnections.create(),
            defaultJobOptions: {
                attempts: 2,
                backoff: {
                    type: 'exponential',
                    delay: FIFTEEN_MINUTES,
                },
                removeOnComplete: true,
                removeOnFail: {
                    age: ONE_MONTH,
                },
            },
        }

        systemJobsQueue = new Queue(SYSTEM_JOB_QUEUE, queueConfig)

        systemJobWorker = new Worker(
            SYSTEM_JOB_QUEUE,
            async (job) => {
                log.debug({ name: 'SystemJob#systemJobWorker' }, `Executing job (${job.name})`)

                const jobHandler = systemJobHandlers.getJobHandler(job.name)
                await jobHandler(job.data)
            },
            {
                connection: await redisConnections.create(),
                concurrency: 1,
            },
        )

        await Promise.all([
            systemJobsQueue.waitUntilReady(),
            systemJobWorker.waitUntilReady(),
        ])
        const { error } = await tryCatch(async () => removeDeprecatedJobs())
        if (!isNil(error)) {
            log.error({ error }, 'Error removing deprecated jobs')
        }
    },

    async upsertJob({ job, schedule, customConfig }): Promise<void> {
        log.info({ name: 'SystemJob#upsertJob', jobName: job.name }, 'Upserting job')
        const existingJob = await getJobByNameAndJobId(job.name, job.jobId)

        const patternChanged = !isNil(existingJob) && schedule.type === 'repeated' ? schedule.cron !== existingJob.opts.repeat?.pattern : false

        if (patternChanged && !isNil(existingJob) && !isNil(existingJob.opts.repeat) && !isNil(existingJob.name)) {
            log.info({ name: 'SystemJob#upsertJob', jobName: job.name }, 'Pattern changed, removing job from queue')
            await systemJobsQueue.removeRepeatable(existingJob.name as SystemJobName, existingJob.opts.repeat)
        }
        if (!isNil(existingJob) && await existingJob.isFailed()) {
            log.info({ name: 'SystemJob#upsertJob', jobName: job.name }, 'Retrying failed job')
            await existingJob.retry()
        }
        if (isNil(existingJob) || patternChanged) {
            log.info({ name: 'SystemJob#upsertJob', jobName: job.name }, 'Adding job to queue')
            const jobOptions = configureJobOptions({ schedule, jobId: job.jobId, customConfig })
            await systemJobsQueue.add(job.name, job.data, jobOptions)
            return
        }
    },

    async getJob<T extends SystemJobName>(jobId: string) {
        return await systemJobsQueue.getJob(jobId) as Job<SystemJobData<T>> | undefined
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

async function removeDeprecatedJobs(): Promise<void> {
    const deprecatedJobs = [
        'trigger-data-cleaner',
        'logs-cleanup-trigger',
        'usage-report',
        'archive-old-issues',
        'platform-usage-report',
        'hard-delete-project',
        'seven-days-in-trial',
        'issue-reminder',
    ]
    const allSystemJobs = await systemJobsQueue.getJobSchedulers()
    const deprecatedJobsFromQueue = allSystemJobs.filter(f => !isNil(f) && !isNil(f.id) && !isNil(f.name) && (deprecatedJobs.includes(f.name) || deprecatedJobs.some(d => f.name.startsWith(d))))
    for (const job of deprecatedJobsFromQueue) {
        await systemJobsQueue.removeJobScheduler(job.id ?? job.key)
    }
    const oneTimeJobs = await systemJobsQueue.getJobs()
    const oneTimeJobsFromQueue = oneTimeJobs.filter(f => !isNil(f) && !isNil(f.id) && !isNil(f.name) && (deprecatedJobs.includes(f.name) || deprecatedJobs.some(d => f.name.startsWith(d))))
    for (const job of oneTimeJobsFromQueue) {
        assertNotNullOrUndefined(job.id, 'Job id is required')
        await job.remove()
    }
}

const configureJobOptions = ({ schedule, jobId, customConfig }: { schedule: JobSchedule, jobId?: string, customConfig?: JobsOptions }): JobsOptions => {
    const config: JobsOptions = customConfig ?? {}

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
    return allSystemJobs.find(job => {
        if (isNil(job)) {
            return false
        }
        if (!isNil(jobId)) {
            return job.name === name && job.id === jobId
        }
        return job.name === name
    })
}
