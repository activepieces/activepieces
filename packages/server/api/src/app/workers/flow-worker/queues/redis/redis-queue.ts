
import { DefaultJobOptions, Job, Queue } from 'bullmq'
import { createRedisClient } from '../../../../database/redis-connection'
import { flowRepo } from '../../../../flows/flow/flow.repo'
import { acquireLock } from '../../../../helper/lock'
import { AddParams, JobType, QueueManager, RemoveParams } from '../queue'
import { exceptionHandler, logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApId, ErrorCode, ExecutionType, isNil, RunEnvironment, ScheduleType,
} from '@activepieces/shared'
import {
    LATEST_JOB_DATA_SCHEMA_VERSION,
    OneTimeJobData,
    RepeatableJobType,
    ScheduledJobData,
    WebhookJobData,
} from 'server-worker'

export const WEBHOOK_JOB_QUEUE = 'webhookJobs'
export const ONE_TIME_JOB_QUEUE = 'oneTimeJobs'
export const SCHEDULED_JOB_QUEUE = 'repeatableJobs'

const EIGHT_MINUTES_IN_MILLISECONDS = 8 * 60 * 1000

const defaultJobOptions: DefaultJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: EIGHT_MINUTES_IN_MILLISECONDS,
    },
    removeOnComplete: true,
}

let oneTimeJobQueue: Queue<OneTimeJobData, unknown>
let scheduledJobQueue: Queue<ScheduledJobData, unknown>
let webhookJobQueue: Queue<WebhookJobData, unknown>

const repeatingJobKey = (id: ApId): string => `activepieces:repeatJobKey:${id}`

type RedisQueueManager = QueueManager & {
    getOneTimeJobQueue(): Queue<OneTimeJobData, unknown>
    getScheduledJobQueue(): Queue<ScheduledJobData, unknown>
    getWebhookJobQueue(): Queue<WebhookJobData, unknown>
}
export const redisQueueManager: RedisQueueManager = {
    getOneTimeJobQueue(): Queue<OneTimeJobData, unknown> {
        return oneTimeJobQueue
    },
    getScheduledJobQueue(): Queue<ScheduledJobData, unknown> {
        return scheduledJobQueue
    },
    getWebhookJobQueue(): Queue<WebhookJobData, unknown> {
        return webhookJobQueue
    },
    async init() {
        logger.info('[redisQueueManager#init] Initializing redis queues')
        oneTimeJobQueue = new Queue<OneTimeJobData, unknown, ApId>(
            ONE_TIME_JOB_QUEUE,
            {
                connection: createRedisClient(),
                defaultJobOptions,
            },
        )
        scheduledJobQueue = new Queue<ScheduledJobData, unknown, ApId>(
            SCHEDULED_JOB_QUEUE,
            {
                connection: createRedisClient(),
                defaultJobOptions,
            },
        )
        webhookJobQueue = new Queue<WebhookJobData, unknown, ApId>(
            WEBHOOK_JOB_QUEUE,
            {
                connection: createRedisClient(),
                defaultJobOptions,
            },
        ) 
        await migrateScheduledJobs()
    },
    async add(params: AddParams<JobType>): Promise<void> {
        logger.debug(params, '[flowQueue#add] params')
        if (params.type === JobType.REPEATING) {
            const { id, data, scheduleOptions } = params
            const job = await scheduledJobQueue.add(id, data, {
                jobId: id,
                repeat: {
                    pattern: scheduleOptions.cronExpression,
                    tz: scheduleOptions.timezone,
                },
            })

            if (isNil(job.repeatJobKey)) {
                return
            }

            logger.debug(`[flowQueue#add] repeatJobKey=${job.repeatJobKey}`)

            const client = await scheduledJobQueue.client
            await client.set(repeatingJobKey(id), job.repeatJobKey)
        }
        else if (params.type === JobType.DELAYED) {
            logger.info(
                `[FlowQueue#add] flowRunId=${params.id} delay=${params.delay}`,
            )

            const { id, data, delay } = params

            await scheduledJobQueue.add(id, data, {
                jobId: id,
                delay,
            })
        }
        else if (params.type === JobType.WEBHOOK) {
            const { id, data } = params
            await webhookJobQueue.add(id, data, {
                jobId: id,
                priority: params.priority === 'high' ? 1 : undefined,
            })
        }
        else {
            const { id, data } = params

            await oneTimeJobQueue.add(id, data, {
                jobId: id,
                priority: params.priority === 'high' ? 1 : undefined,
            })
        }
    },

    async removeRepeatingJob({ id }: RemoveParams): Promise<void> {
        const client = await scheduledJobQueue.client
        const jobKey = await findRepeatableJobKey(id)
        if (isNil(jobKey)) {
            /*
                If the trigger activation failed, don't let the function fail, just ignore the action, and log an error
                message indicating that the job with key "${jobKey}" couldn't be found, even though it should exist, and
                proceed to skip the deletion.
            */
            exceptionHandler.handle(new Error(`Couldn't find job key for id "${id}"`))
        }
        else {
            const result = await scheduledJobQueue.removeRepeatableByKey(jobKey)
            await client.del(repeatingJobKey(id))

            if (!result) {
                throw new ActivepiecesError({
                    code: ErrorCode.JOB_REMOVAL_FAILURE,
                    params: {
                        jobId: id,
                    },
                })
            }
        }
    },
}

async function findRepeatableJobKey(id: ApId): Promise<string | undefined> {
    const client = await scheduledJobQueue.client
    const jobKey = await client.get(repeatingJobKey(id))
    if (isNil(jobKey)) {
        logger.warn({ jobKey: id }, 'Job key not found in redis, trying to find it in the queue')
        // TODO: this temporary solution for jobs that doesn't have repeatJobKey in redis, it's also confusing because it search by flowVersionId
        const jobs = await scheduledJobQueue.getJobs()
        return jobs.filter(f => !isNil(f) && !isNil(f.data)).find((f) => f.data.flowVersionId === id)?.repeatJobKey
    }
    return jobKey
}

type MaybeJob = Job<ScheduledJobData, unknown> | undefined

const jobDataSchemaVersionIsNotLatest = (
    job: MaybeJob,
): job is Job<ScheduledJobData, unknown> => {
    return (
        !isNil(job) &&
        !isNil(job.data) &&
        job.data.schemaVersion !== LATEST_JOB_DATA_SCHEMA_VERSION
    )
}

const migrateScheduledJobs = async (): Promise<void> => {
    const migrationLock = await acquireLock({
        key: 'jobs_lock',
        timeout: 30000,
    })
    try {
        logger.info('[migrateScheduledJobs] Starting migration')
        let migratedJobs = 0
        const scheduledJobs: MaybeJob[] = await scheduledJobQueue.getJobs()
        logger.info(
            `[migrateScheduledJobs] Found  ${scheduledJobs.length} total jobs`,
        )
        const jobsToMigrate = scheduledJobs.filter(jobDataSchemaVersionIsNotLatest)
        for (const job of jobsToMigrate) {
            // Cast as we are not sure about the schema
            let modifiedJobData = JSON.parse(JSON.stringify(job.data))
            if (
                modifiedJobData.schemaVersion === undefined ||
                modifiedJobData.schemaVersion === 1
            ) {
                const { flowVersion, projectId, triggerType } = modifiedJobData
                modifiedJobData = {
                    schemaVersion: 2,
                    flowVersionId: flowVersion.id,
                    flowId: flowVersion.flowId,
                    projectId,
                    environment: RunEnvironment.PRODUCTION,
                    executionType: ExecutionType.BEGIN,
                    triggerType,
                }
                migratedJobs++
                await job.updateData(modifiedJobData)
            }
            if (modifiedJobData.schemaVersion === 2) {
                const updated = await updateCronExpressionOfRedisToPostgresTable(job)
                if (updated) {
                    modifiedJobData.schemaVersion = 3
                    migratedJobs++
                    await job.updateData(modifiedJobData)
                }
            }
            if (modifiedJobData.schemaVersion === 3) {
                modifiedJobData.schemaVersion = 4
                migratedJobs++
                if (modifiedJobData.executionType === ExecutionType.BEGIN) {
                    modifiedJobData.jobType = RepeatableJobType.EXECUTE_TRIGGER
                }
                if (modifiedJobData.executionType === ExecutionType.RESUME) {
                    modifiedJobData.jobType = RepeatableJobType.DELAYED_FLOW
                }
                modifiedJobData.executionType = undefined

                await job.updateData(modifiedJobData)
            }
        }
        logger.info(`[migrateScheduledJobs] Migrated ${migratedJobs} jobs`)
    }
    finally {
        await migrationLock.release()
    }
}

async function updateCronExpressionOfRedisToPostgresTable(
    job: Job,
): Promise<boolean> {
    const tz = job.opts.repeat?.tz
    const pattern = job.opts.repeat?.pattern
    if (isNil(tz) || isNil(pattern)) {
        logger.error('Found unrepeatable job in repeatable queue')
        return false
    }
    const flow = await flowRepo().findOneBy({
        publishedVersionId: job.data.flowVersionId,
    })
    if (flow) {
        await flowRepo().update(flow.id, {
            schedule: {
                type: ScheduleType.CRON_EXPRESSION,
                timezone: tz,
                cronExpression: pattern,
            },
        })
        return true
    }
    return false
}
