import { DefaultJobOptions, Queue } from 'bullmq'
import { ApId, ScheduleOptions } from '@activepieces/shared'
import { createRedisClient } from '../../database/redis-connection'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { OneTimeJobData, RepeatableJobData } from './job-data'
import { logger } from '../../helper/logger'

type BaseAddParams = {
    id: ApId
}

type RepeatableJobAddParams = {
    data: RepeatableJobData
    scheduleOptions: ScheduleOptions
} & BaseAddParams

type OneTimeJobAddParams = {
    data: OneTimeJobData
} & BaseAddParams

type AddParams = OneTimeJobAddParams | RepeatableJobAddParams

type RemoveParams = {
    id: ApId
}

export const ONE_TIME_JOB_QUEUE = 'oneTimeJobs'
export const REPEATABLE_JOB_QUEUE = 'repeatableJobs'

const EIGHT_MINUTES_IN_MILLISECONDS = 8 * 60 * 1000

const defaultJobOptions: DefaultJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: EIGHT_MINUTES_IN_MILLISECONDS,
    },
}

const oneTimeJobQueue = new Queue<OneTimeJobData, unknown, ApId>(ONE_TIME_JOB_QUEUE, {
    connection: createRedisClient(),
    defaultJobOptions,
})

const repeatableJobQueue = new Queue<RepeatableJobData, unknown, ApId>(REPEATABLE_JOB_QUEUE, {
    connection: createRedisClient(),
    defaultJobOptions,
})

const repeatableJobKey = (id: ApId): string => `activepieces:repeatJobKey:${id}`

export const flowQueue = {
    async add(params: AddParams): Promise<void> {
        logger.info('[flowQueue#add] params=', params)
        if (isRepeatable(params)) {
            const { id, data, scheduleOptions } = params

            const job = await repeatableJobQueue.add(id, data, {
                jobId: id,
                removeOnComplete: true,
                repeat: {
                    pattern: scheduleOptions.cronExpression,
                    tz: scheduleOptions.timezone,
                },
            })

            const client = await repeatableJobQueue.client

            await client.set(repeatableJobKey(id), job.repeatJobKey)
        }
        else {
            const { id, data } = params

            await oneTimeJobQueue.add(id, data, {
                removeOnComplete: true,
                jobId: id,
            })
        }
    },

    async removeRepeatableJob({ id }: RemoveParams): Promise<void> {
        const client = await repeatableJobQueue.client
        const jobKey = await client.get(repeatableJobKey(id))

        if (jobKey === null) {
            // If the trigger activation failed, don't let the function fail.
            // Just ignore the action. Log an error message indicating that the job with key "${jobKey}" couldn't be found, even though it should exist, and proceed to skip the deletion.
            logger.error(`Couldn't find job ${jobKey}, even though It should exists, skipping delete`)
        }
        else {

            const result = await repeatableJobQueue.removeRepeatableByKey(jobKey)
            await client.del(repeatableJobKey(id))

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

const isRepeatable = (params: AddParams): params is RepeatableJobAddParams => {
    return (params as RepeatableJobAddParams).scheduleOptions?.cronExpression !== undefined
}
