import {
    apId,
    ExecuteFlowJobData,
    ExecutionType,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RunEnvironment,
    StreamStepProgress,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
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
const activeKey = (): string => `bull:${QueueName.WORKER_JOBS}:active`
const failedKey = (): string => `bull:${QueueName.WORKER_JOBS}:failed`
const waitKey = (): string => `bull:${QueueName.WORKER_JOBS}:wait`

describe('jobBroker.tryDequeue — invalid-schema poison handling', () => {
    it('fails the job as unrecoverable when migrated data still fails JobData.parse, instead of recycling', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        const validJobData: ExecuteFlowJobData = {
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
            logsUploadUrl: 'https://example.invalid/v1/flow-runs/logs?token=x',
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: validJobData,
        })

        const redis = await redisConnections.useExisting()

        const poisonedRaw = JSON.stringify({
            jobType: WorkerJobType.EXECUTE_FLOW,
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            projectId: mockProject.id,
            platformId: mockPlatform.id,
            runId: apId(),
            executionType: 'BEGIN',
        })
        await redis.hset(jobKey(jobId), 'data', poisonedRaw)

        const polled = await jobBroker(app.log).poll()

        expect(polled).toBeNull()

        const failedAfter = await redis.zrange(failedKey(), 0, -1)
        const activeAfter = await redis.lrange(activeKey(), 0, -1)
        const waitAfter = await redis.lrange(waitKey(), 0, -1)

        expect(failedAfter).toContain(jobId)
        expect(activeAfter).not.toContain(jobId)
        expect(waitAfter).not.toContain(jobId)

        const failedReason = await redis.hget(jobKey(jobId), 'failedReason')
        expect(failedReason).toContain('Job data failed schema validation after migration')
    })
})
