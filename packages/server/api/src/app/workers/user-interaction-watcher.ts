import { apId, LATEST_JOB_DATA_SCHEMA_VERSION, UserInteractionJobDataWithoutWatchingInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue, JobType } from './job-queue/job-queue'

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

const pendingJobs = new Map<string, {
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
    timeout: ReturnType<typeof setTimeout>
}>()

export const userInteractionWatcher = {
    submitAndWaitForResponse: async <T>(request: UserInteractionJobDataWithoutWatchingInformation, log: FastifyBaseLogger, requestId?: string): Promise<T> => {
        const id = requestId ?? apId()

        const promise = new Promise<T>((resolve, reject) => {
            const timeout = setTimeout(() => {
                pendingJobs.delete(id)
                reject(new Error(`User interaction job ${id} timed out after ${TIMEOUT_MS}ms`))
            }, TIMEOUT_MS)

            pendingJobs.set(id, {
                resolve: resolve as (value: unknown) => void,
                reject,
                timeout,
            })
        })

        const job = await jobQueue(log).add({
            id,
            type: JobType.ONE_TIME,
            data: {
                ...request,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            },
        })
        if (!job) {
            const entry = pendingJobs.get(id)
            if (entry) {
                clearTimeout(entry.timeout)
                pendingJobs.delete(id)
            }
            throw new Error('Failed to create job')
        }

        return promise
    },

    resolveJob(jobId: string, response: { response: unknown }, log: FastifyBaseLogger): void {
        const entry = pendingJobs.get(jobId)
        if (!entry) {
            log.debug({ jobId }, '[userInteractionWatcher#resolveJob] No pending entry found')
            return
        }
        clearTimeout(entry.timeout)
        pendingJobs.delete(jobId)
        entry.resolve(response.response)
    },

    rejectJob(jobId: string, error: unknown, log: FastifyBaseLogger): void {
        const entry = pendingJobs.get(jobId)
        if (!entry) {
            log.debug({ jobId }, '[userInteractionWatcher#rejectJob] No pending entry found')
            return
        }
        clearTimeout(entry.timeout)
        pendingJobs.delete(jobId)
        entry.reject(error)
    },

    shutdown(): void {
        for (const [jobId, entry] of pendingJobs) {
            clearTimeout(entry.timeout)
            entry.reject(new Error('Server shutting down'))
            pendingJobs.delete(jobId)
        }
    },
}
