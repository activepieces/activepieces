import { onCallService } from '@activepieces/server-utils'
import { UnrecoverableError } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../system/system'
import { AppSystemProp } from '../system/system-props'
import { SystemJobName } from './common'

export const systemJobFailurePager = {
    gaveUp({ attemptsMade, attempts, error }: GaveUpParams): boolean {
        return error instanceof UnrecoverableError || attemptsMade >= (attempts ?? 1)
    },

    pageOnFinalFailure({ jobName, jobId, attemptsMade, error, log }: PageOnFinalFailureParams): void {
        if (!PAGED_SYSTEM_JOBS.has(jobName)) {
            return
        }
        onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page({
            code: 'SYSTEM_JOB_FAILED',
            message: `System job "${jobName}" gave up after ${attemptsMade} attempts and will not run again until the next API boot: ${error.message}`,
            params: { jobName, jobId, attemptsMade },
        }).catch((pageError) => {
            log.error({ pageError }, '[systemJob#worker] Failed to send on-call page for a failed system job')
        })
    },
}

const PAGED_SYSTEM_JOBS = new Set<string>([SystemJobName.RUN_BACKGROUND_MIGRATIONS])

type GaveUpParams = {
    attemptsMade: number
    attempts: number | undefined
    error: Error
}

type PageOnFinalFailureParams = {
    jobName: string
    jobId: string | undefined
    attemptsMade: number
    error: Error
    log: FastifyBaseLogger
}
