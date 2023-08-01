import { DefaultJobOptions, Queue } from 'bullmq'
import { ApId } from '@activepieces/shared'
import { createRedisClient } from '../../../../database/redis-connection'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { logger } from '../../../../helper/logger'
import { isNil } from '@activepieces/shared'
import { OneTimeJobData, ScheduledJobData } from '../../job-data'
import { AddParams, JobType, QueueManager, RemoveParams } from '../queue'
import { flowInstanceRepo } from '../../../../flows/flow-instance/flow-instance.service'
import { ExecutionType, RunEnvironment, ScheduleType } from '@activepieces/shared'
import { LATEST_JOB_DATA_SCHEMA_VERSION } from '../../job-data'
import { Job } from 'bullmq'
import { acquireLock } from '../../../../helper/lock'

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

const repeatingJobKey = (id: ApId): string => `activepieces:repeatJobKey:${id}`

export const redisQueueManager: QueueManager = {
    async init() {
        logger.info('[redisQueueManager#init] Initializing redis queues')
        oneTimeJobQueue = new Queue<OneTimeJobData, unknown, ApId>(ONE_TIME_JOB_QUEUE, {
            connection: createRedisClient(),
            defaultJobOptions,
        })
        scheduledJobQueue = new Queue<ScheduledJobData, unknown, ApId>(SCHEDULED_JOB_QUEUE, {
            connection: createRedisClient(),
            defaultJobOptions,
        })
        await migrateScheduledJobs()

    },
    async add(params: AddParams): Promise<void> {
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
            logger.info(`[FlowQueue#add] flowRunId=${params.id} delay=${params.delay}`)

            const { id, data, delay } = params

            await scheduledJobQueue.add(id, data, {
                jobId: id,
                delay,
            })
        }
        else {
            const { id, data } = params

            await oneTimeJobQueue.add(id, data, {
                jobId: id,
            })
        }
    },

    async removeRepeatingJob({ id }: RemoveParams): Promise<void> {
        const client = await scheduledJobQueue.client
        const jobKey = await client.get(repeatingJobKey(id))

        if (jobKey === null) {
            /*
                If the trigger activation failed, don't let the function fail, just ignore the action, and log an error
                message indicating that the job with key "${jobKey}" couldn't be found, even though it should exist, and
                proceed to skip the deletion.
            */
            logger.error(`Couldn't find job ${jobKey}, even though It should exists, skipping delete`)
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

const migrateScheduledJobs = async (): Promise<void> => {
    const migrationLock = await acquireLock({
        key: 'jobs_lock',
        timeout: 30000,
    })
    try {
        logger.info('[migrateScheduledJobs] Starting migration')
        let migratedJobs = 0
        const scheduledJobs = await scheduledJobQueue.getJobs()
        logger.info(`[migrateScheduledJobs] Found  ${scheduledJobs.length} total jobs`)
        const jobsToMigrate = scheduledJobs.filter((job) => job.data.schemaVersion !== LATEST_JOB_DATA_SCHEMA_VERSION)
        for (const job of jobsToMigrate) {
            // Cast as we are not sure about the schema
            let modifiedJobData = JSON.parse(JSON.stringify(job.data))
            if (modifiedJobData.schemaVersion === undefined || modifiedJobData.schemaVersion === 1) {
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
                await job.update(modifiedJobData)
            }
            if (modifiedJobData.schemaVersion === 2) {
                const updated = await updateCronExpressionOfRedisToPostgresTable(job)
                if (updated) {
                    modifiedJobData.schemaVersion = 3
                    migratedJobs++
                    await job.update(modifiedJobData)
                }
            }
        }
        logger.info(`[migrateScheduledJobs] Migrated ${migratedJobs} jobs`)
    }
    finally {
        await migrationLock.release()
    }
}

async function updateCronExpressionOfRedisToPostgresTable(job: Job): Promise<boolean> {
    const tz = job.opts.repeat?.tz
    const pattern = job.opts.repeat?.pattern
    if (isNil(tz) || isNil(pattern)) {
        logger.error('Found unrepeatable job in repeatable queue')
        return false
    }
    const flowInstance = await flowInstanceRepo.findOneBy({
        flowVersionId: job.data.flowVersionId,
    })
    if (!isNil(flowInstance)) {
        await flowInstanceRepo.update(flowInstance.id, {
            ...flowInstance,
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
