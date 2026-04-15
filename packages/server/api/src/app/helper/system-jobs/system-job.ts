import { apDayjs, apDayjsDuration } from '@activepieces/server-utils'
import { assertNotNullOrUndefined, isNil, tryCatch } from '@activepieces/shared'
import { Job, JobsOptions, Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { exceptionHandler } from '../exception-handler'
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
        await systemJobsQueue.waitUntilReady()

        const { error } = await tryCatch(async () => removeDeprecatedJobs())
        if (!isNil(error)) {
            log.error({ err: error }, '[systemJob#init] Error removing deprecated jobs')
        }
    },

    async startWorker(): Promise<void> {
        systemJobWorker = new Worker(
            SYSTEM_JOB_QUEUE,
            async (job) => {
                log.debug({ jobName: job.name }, '[systemJob#worker] Executing job')

                const jobHandler = systemJobHandlers.getJobHandler(job.name)
                await jobHandler(job.data)
            },
            {
                connection: await redisConnections.create(),
                concurrency: 5,
            },
        )

        systemJobWorker.on('failed', (job, err) => {
            const attemptsUsed = job?.attemptsMade ?? 0
            const maxAttempts = job?.opts?.attempts ?? Infinity
            if (attemptsUsed >= maxAttempts) {
                exceptionHandler.handle(err, log)
            }
        })

        await systemJobWorker.waitUntilReady()
    },

    async upsertJob({ job, schedule, customConfig }): Promise<void> {
        log.info({ jobName: job.name }, '[systemJob#upsertJob] Upserting job')
        const existingJob = await getJobByNameAndJobId(job.name, job.jobId)

        const patternChanged = !isNil(existingJob) && schedule.type === 'repeated' ? schedule.cron !== existingJob.opts.repeat?.pattern : false

        if (patternChanged && !isNil(existingJob) && !isNil(existingJob.opts.repeat) && !isNil(existingJob.name)) {
            log.info({ jobName: job.name }, '[systemJob#upsertJob] Pattern changed, removing job from queue')
            await systemJobsQueue.removeRepeatable(existingJob.name as SystemJobName, existingJob.opts.repeat)
        }
        if (!isNil(existingJob) && await existingJob.isFailed()) {
            log.info({ jobName: job.name }, '[systemJob#upsertJob] Retrying failed job')
            await existingJob.retry()
        }
        if (isNil(existingJob) || patternChanged) {
            log.info({ jobName: job.name }, '[systemJob#upsertJob] Adding job to queue')
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
            systemJobsQueue.close(),
            systemJobWorker?.close(),
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
        'seven-days-in-trial',
        'issue-reminder',
        'update-flow-status',
    ]
    const allSystemJobs = await systemJobsQueue.getJobSchedulers()
    const knownJobNames = Object.values(SystemJobName) as string[]
    const deprecatedSchedulers = allSystemJobs.filter(f => !isNil(f) && !isNil(f.id) && !isNil(f.name) && (deprecatedJobs.includes(f.name) || deprecatedJobs.some(d => f.name.startsWith(d))))
    const legacySchedulers = allSystemJobs.filter(f =>
        knownJobNames.includes(f.name) && f.key.includes('::'),
    )
    await Promise.all(
        [...deprecatedSchedulers, ...legacySchedulers].map(job =>
            systemJobsQueue.removeJobScheduler(job.id ?? job.key),
        ),
    )

    const oneTimeJobs = await systemJobsQueue.getJobs()
    const deprecatedOneTimeJobs = oneTimeJobs.filter(f => !isNil(f) && !isNil(f.id) && !isNil(f.name) && (deprecatedJobs.includes(f.name) || deprecatedJobs.some(d => f.name.startsWith(d))))
    await Promise.all(
        deprecatedOneTimeJobs.map(job => {
            assertNotNullOrUndefined(job.id, 'Job id is required')
            return job.remove()
        }),
    )
}

const configureJobOptions = ({ schedule, jobId, customConfig }: { schedule: JobSchedule, jobId: string, customConfig?: JobsOptions }): JobsOptions => {
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
        jobId,
    }
}

const getJobByNameAndJobId = async (name: string, jobId: string): Promise<Job | undefined> => {
    const job = await systemJobsQueue.getJob(jobId)
    if (!isNil(job) && job.name === name) {
        return job
    }
    return undefined
}
