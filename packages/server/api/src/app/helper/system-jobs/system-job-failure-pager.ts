import { tryCatch } from '@activepieces/core-utils'
import { onCallService } from '@activepieces/server-utils'
import { UnrecoverableError } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { backgroundMigrationRunner } from '../../database/background-migration-runner'
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
        listPendingMigrations({ log })
            .then((pendingMigrations) => onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page({
                code: 'SYSTEM_JOB_FAILED',
                message: `Background migrations stopped: "${jobName}" gave up after ${attemptsMade} attempts (${error.message}). Pending: ${pendingMigrations?.join(', ') ?? 'unknown, background_migrations could not be read'}. Restart an API pod or deploy to retry them.`,
                params: { jobName, jobId, attemptsMade, error: error.message, pendingMigrations: pendingMigrations ?? null },
            }))
            .catch((pageError) => {
                log.error({ pageError }, '[systemJob#worker] Failed to send on-call page for a failed system job')
            })
    },
}

async function listPendingMigrations({ log }: { log: FastifyBaseLogger }): Promise<string[] | undefined> {
    const { data, error } = await tryCatch(async () => Promise.race([
        backgroundMigrationRunner.listPending(),
        rejectAfter({ ms: PENDING_LOOKUP_TIMEOUT_MS }),
    ]))
    if (error) {
        log.error({ error: error.message }, '[systemJob#worker] Could not list pending background migrations for the on-call page')
        return undefined
    }
    return data
}

function rejectAfter({ ms }: { ms: number }): Promise<never> {
    return new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms).unref()
    })
}

const PAGED_SYSTEM_JOBS = new Set<string>([SystemJobName.RUN_BACKGROUND_MIGRATIONS])
const PENDING_LOOKUP_TIMEOUT_MS = 5_000

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
