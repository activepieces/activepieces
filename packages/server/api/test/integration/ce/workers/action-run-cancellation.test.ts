import { apId } from '@activepieces/core-utils'
import { ExecuteActionJobData, FlowActionType, LATEST_JOB_DATA_SCHEMA_VERSION, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { Job } from 'bullmq'
import { redisConnections } from '../../../../src/app/database/redis-connections'
import { QueueName } from '../../../../src/app/workers/job'
import { jobBroker } from '../../../../src/app/workers/job-queue/job-broker'
import { jobQueue, JobType } from '../../../../src/app/workers/job-queue/job-queue'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
    await jobBroker(app.log).init()
})

afterAll(async () => {
    await jobBroker(app.log).close()
    await teardownTestEnvironment()
})

const jobKey = (jobId: string): string => `bull:${QueueName.WORKER_JOBS}:${jobId}`

async function enqueueActionRunJob(): Promise<EnqueuedActionRunJob> {
    const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
    const jobId = apId()
    const data: ExecuteActionJobData = {
        jobType: WorkerJobType.EXECUTE_ACTION,
        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
        projectId: mockProject.id,
        platformId: mockPlatform.id,
        step: {
            name: 'step_1',
            valid: true,
            displayName: 'Test Code',
            lastUpdatedDate: new Date().toISOString(),
            type: FlowActionType.CODE,
            settings: {
                sourceCode: { packageJson: '{}', code: 'export const code = async () => true' },
                input: {},
            },
        },
        expiresAt: Date.now() + 120_000,
        requestId: apId(),
        webserverId: 'test-webserver',
    }
    await jobQueue(app.log).add({ type: JobType.ONE_TIME, id: jobId, data })
    return { jobId, platformId: mockPlatform.id, projectId: mockProject.id }
}

async function cancelAndReport({ jobId, platformId, projectId }: EnqueuedActionRunJob): Promise<boolean> {
    return jobQueue(app.log).cancelAndReportNeverStarted({
        jobId,
        platformId,
        projectId,
        jobType: WorkerJobType.EXECUTE_ACTION,
    })
}

async function pollOwnJob(expectedJobId: string): Promise<{ token: string, job: Job }> {
    const polled = await jobBroker(app.log).poll()
    expect(polled?.jobId).toBe(expectedJobId)
    const queue = await jobQueue(app.log).getOrCreateQueue({ queueName: polled!.queueName })
    const job = await queue.getJob(expectedJobId)
    expect(job).not.toBeNull()
    return { token: polled!.token, job: job! }
}

describe('jobQueue.cancelAndReportNeverStarted', () => {
    it('returns false for a job that does not exist', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        const result = await jobQueue(app.log).cancelAndReportNeverStarted({
            jobId: apId(),
            platformId: mockPlatform.id,
            projectId: mockProject.id,
            jobType: WorkerJobType.EXECUTE_ACTION,
        })

        expect(result).toBe(false)
    })

    it('reports never-started and removes the job when it was never dequeued', async () => {
        const enqueued = await enqueueActionRunJob()
        const redis = await redisConnections.useExisting()

        const result = await cancelAndReport(enqueued)

        expect(result).toBe(true)
        expect(await redis.exists(jobKey(enqueued.jobId))).toBe(0)
    })

    it('reports dequeued and leaves the job in place while a worker holds the lock', async () => {
        const enqueued = await enqueueActionRunJob()
        const { token, job } = await pollOwnJob(enqueued.jobId)
        const redis = await redisConnections.useExisting()

        const result = await cancelAndReport(enqueued)

        expect(result).toBe(false)
        expect(await redis.exists(jobKey(enqueued.jobId))).toBe(1)

        await job.moveToCompleted(null, token, false)
        await job.remove()
    })

    it('reports dequeued for a requeued job that already ran once, and still removes it', async () => {
        const enqueued = await enqueueActionRunJob()
        const { token, job } = await pollOwnJob(enqueued.jobId)
        await job.moveToDelayed(Date.now() + 60_000, token)
        const redis = await redisConnections.useExisting()

        const result = await cancelAndReport(enqueued)

        expect(result).toBe(false)
        expect(await redis.exists(jobKey(enqueued.jobId))).toBe(0)
    })

    it('reports dequeued for a job that already completed, and removes it', async () => {
        const enqueued = await enqueueActionRunJob()
        const { token, job } = await pollOwnJob(enqueued.jobId)
        await job.moveToCompleted(null, token, false)
        const redis = await redisConnections.useExisting()

        const result = await cancelAndReport(enqueued)

        expect(result).toBe(false)
        expect(await redis.exists(jobKey(enqueued.jobId))).toBe(0)
    })
})

type EnqueuedActionRunJob = {
    jobId: string
    platformId: string
    projectId: string
}
