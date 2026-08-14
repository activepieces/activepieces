import { isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs, apDayjsDuration } from '@activepieces/server-utils'
import { Job, JobsOptions, Queue, Worker } from 'bullmq'
import { Dayjs } from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { exceptionHandler } from '../exception-handler'
import { SystemJobData, SystemJobName, SystemJobSchedule } from './common'
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

        const { error } = await tryCatch(async () => removeDeprecatedJobs(log))
        if (!isNil(error)) {
            log.error({ error }, '[systemJob#init] Error removing deprecated jobs')
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
        if (schedule.type === 'repeated') {
            const schedulers = await systemJobsQueue.getJobSchedulers()
            const legacySchedulers = schedulers.filter(scheduler => scheduler.name === job.name && (scheduler.id ?? scheduler.key) !== job.name)
            for (const scheduler of legacySchedulers) {
                log.info({ jobName: job.name, stalePattern: scheduler.pattern }, '[systemJob#upsertJob] Removing scheduler with a non-canonical key')
                await systemJobsQueue.removeJobScheduler(scheduler.id ?? scheduler.key)
            }
            await systemJobsQueue.upsertJobScheduler(job.name, { pattern: schedule.cron, tz: 'UTC' }, { name: job.name, data: job.data, opts: customConfig })
            return
        }
        const existingJob = await getJobByNameAndJobId(job.name, job.jobId)
        if (!isNil(existingJob) && await existingJob.isFailed()) {
            log.info({ jobName: job.name }, '[systemJob#upsertJob] Retrying failed job')
            await existingJob.retry()
        }
        if (isNil(existingJob)) {
            log.info({ jobName: job.name }, '[systemJob#upsertJob] Adding job to queue')
            await systemJobsQueue.add(job.name, job.data, configureJobOptions({ date: schedule.date, jobId: job.jobId, customConfig }))
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

async function removeDeprecatedJobs(log: FastifyBaseLogger): Promise<void> {
    const deprecatedJobs = [
        'trigger-data-cleaner',
        'logs-cleanup-trigger',
        'usage-report',
        'archive-old-issues',
        'platform-usage-report',
        'seven-days-in-trial',
        'issue-reminder',
        'update-flow-status',
        'expire-pending-sso-domains',
        'console-usage-report',
        'flow-run-tracking',
        'chat-funnel-sync',
        'trial-tracker',
        'ai-credit-update-check',
    ]
    const knownJobNames = Object.values(SystemJobName) as string[]
    const isDeprecated = (name: string): boolean => !knownJobNames.includes(name) && deprecatedJobs.some(d => name.startsWith(d))

    const allSystemJobs = await systemJobsQueue.getJobSchedulers()
    const deprecatedSchedulers = allSystemJobs.filter(f => !isNil(f.name) && isDeprecated(f.name))
    const legacySchedulers = allSystemJobs.filter(f =>
        knownJobNames.includes(f.name) && f.key.includes('::'),
    )
    const schedulerResults = await Promise.allSettled(
        [...deprecatedSchedulers, ...legacySchedulers].map(job =>
            systemJobsQueue.removeJobScheduler(job.id ?? job.key),
        ),
    )

    const oneTimeJobs = await systemJobsQueue.getJobs()
    const deprecatedOneTimeJobs = oneTimeJobs.filter(f => !isNil(f) && !isNil(f.id) && !isNil(f.name) && isDeprecated(f.name))
    const oneTimeJobResults = await Promise.allSettled(
        deprecatedOneTimeJobs.map(job => job.remove()),
    )

    for (const result of [...schedulerResults, ...oneTimeJobResults]) {
        if (result.status === 'rejected') {
            log.warn({ error: result.reason }, '[systemJob#removeDeprecatedJobs] Failed to remove a deprecated job')
        }
    }
}

const configureJobOptions = ({ date, jobId, customConfig }: { date: Dayjs, jobId: string, customConfig?: JobsOptions }): JobsOptions => {
    const config: JobsOptions = customConfig ?? {}
    config.delay = date.diff(apDayjs(), 'milliseconds')
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
