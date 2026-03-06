import { trace } from '@opentelemetry/api'
import { sleep } from '@activepieces/server-common'
import { tryCatch } from '@activepieces/shared'
import { apiClient } from './api/api-client'
import { logger } from './config/logger'

const tracer = trace.getTracer('worker')

const DEFAULT_POLL_TIMEOUT_MS = 30_000

let running = false

export const worker = {
    async start(apiUrl: string, workerToken: string, pollTimeoutMs = DEFAULT_POLL_TIMEOUT_MS): Promise<void> {
        running = true
        logger.info('Worker started, polling for jobs...')
        while (running) {
            await pollAndExecute(apiUrl, workerToken, pollTimeoutMs)
        }
        logger.info('Worker stopped')
    },

    stop(): void {
        running = false
    },
}

async function pollAndExecute(apiUrl: string, workerToken: string, pollTimeoutMs: number): Promise<void> {
    const { data: job, error: pollError } = await tryCatch(
        () => apiClient.poll(apiUrl, workerToken, pollTimeoutMs),
    )

    if (pollError) {
        logger.error({ error: pollError }, 'Poll error')
        await sleep(5000)
        return
    }

    if (!job) {
        return
    }

    await executeJob(apiUrl, workerToken, job)
}

async function executeJob(apiUrl: string, workerToken: string, job: { jobId: string, data: unknown }): Promise<void> {
    await tracer.startActiveSpan('worker.executeJob', { attributes: { 'worker.jobId': job.jobId } }, async (span) => {
        try {
            const log = logger.child({ jobId: job.jobId })
            log.info('Received job')

            const { error } = await tryCatch(async () => {
                // TODO: Route to appropriate executor based on job data
                log.info({ data: job.data }, 'Executing job')
                await apiClient.reportJobCompleted(apiUrl, workerToken, job.jobId, { status: 'completed' })
            })

            if (error) {
                log.error({ error }, 'Job failed')
                span.recordException(error)
                const { error: reportError } = await tryCatch(
                    () => apiClient.reportJobFailed(apiUrl, workerToken, job.jobId, error.message),
                )
                if (reportError) {
                    log.error({ error: reportError }, 'Failed to report job failure')
                }
            }
        }
        finally {
            span.end()
        }
    })
}
