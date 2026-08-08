import { isNil } from '@activepieces/core-utils'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { systemJobIds, SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'

async function schedule({ flowRunId, projectId, waitpointId, resumeDateTime, log }: ScheduleParams): Promise<void> {
    await systemJobsSchedule(log).upsertJob({
        job: {
            name: SystemJobName.RESUME_DELAY_WAITPOINT,
            data: { flowRunId, projectId, waitpointId },
            jobId: systemJobIds.resumeDelay({ waitpointId }),
        },
        schedule: {
            type: 'one-time',
            date: dayjs(resumeDateTime),
        },
    })
}

async function remove({ waitpointId, flowRunId, log }: RemoveParams): Promise<void> {
    await systemJobsSchedule(log).removeJob({ jobId: systemJobIds.resumeDelay({ waitpointId }) })
    const legacyJobId = systemJobIds.legacyResumeDelay({ flowRunId })
    const legacyJob = await systemJobsSchedule(log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(legacyJobId)
    if (!isNil(legacyJob) && legacyJob.data.waitpointId === waitpointId) {
        await systemJobsSchedule(log).removeJob({ jobId: legacyJobId })
    }
}

export const waitpointTimeoutJob = { schedule, remove }

type ScheduleParams = {
    flowRunId: string
    projectId: string
    waitpointId: string
    resumeDateTime: string
    log: FastifyBaseLogger
}

type RemoveParams = {
    waitpointId: string
    flowRunId: string
    log: FastifyBaseLogger
}
