import { apId } from '@activepieces/core-utils'
import { ExecuteFlowJobData, ExecutionType, LATEST_JOB_DATA_SCHEMA_VERSION, RunEnvironment, StreamStepProgress, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { redisConnections } from '../../../../src/app/database/redis-connections'
import { QueueName } from '../../../../src/app/workers/job'
import { jobBroker, MAX_RECLAIM_ATTEMPTS } from '../../../../src/app/workers/job-queue/job-broker'
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
const failedKey = (): string => `bull:${QueueName.WORKER_JOBS}:failed`
const reclaimCountKey = (jobId: string): string => `job_reclaim_count:${jobId}`

describe('jobBroker — repeated worker-disconnect reclaim limit', () => {
    it('permanently fails a job after MAX_RECLAIM_ATTEMPTS disconnect-reclaims instead of redelivering forever', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        const jobData: ExecuteFlowJobData = {
            jobType: WorkerJobType.EXECUTE_FLOW,
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            projectId: mockProject.id,
            platformId: mockPlatform.id,
            flowId: apId(),
            flowVersionId: apId(),
            runId: apId(),
            environment: RunEnvironment.PRODUCTION,
            executionType: ExecutionType.BEGIN,
            streamStepProgress: StreamStepProgress.NONE,
            payload: { type: 'inline', value: null },
            logsFileId: apId(),
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        for (let cycle = 0; cycle < MAX_RECLAIM_ATTEMPTS; cycle++) {
            const connectionId = `conn-${cycle}`
            const polled = await jobBroker(app.log).poll(QueueName.WORKER_JOBS, { id: connectionId, connected: true })
            expect(polled?.jobId).toBe(jobId)

            await jobBroker(app.log).releaseConnectionJobs(connectionId)
        }

        const redis = await redisConnections.useExisting()

        const failedAfter = await redis.zrange(failedKey(), 0, -1)
        expect(failedAfter).toContain(jobId)

        const failedReason = await redis.hget(jobKey(jobId), 'failedReason')
        expect(failedReason).toContain('disconnected its worker')

        const reclaimCountAfter = await redis.get(reclaimCountKey(jobId))
        expect(reclaimCountAfter).toBeNull()
    })
})
