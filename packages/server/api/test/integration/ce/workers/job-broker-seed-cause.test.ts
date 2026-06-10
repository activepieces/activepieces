import { FastifyInstance } from 'fastify'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { jobBroker } from '../../../../src/app/workers/job-queue/job-broker'
import { jobQueue, JobType } from '../../../../src/app/workers/job-queue/job-queue'
import { redisConnections } from '../../../../src/app/database/redis-connections'
import { QueueName } from '../../../../src/app/workers/job'
import {
    apId,
    EngineResponseStatus,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    TriggerHookType,
    WorkerJobType,
} from '@activepieces/shared'

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
const lockKey = (jobId: string): string => `${jobKey(jobId)}:lock`
const activeKey = (): string => `bull:${QueueName.WORKER_JOBS}:active`
const completedKey = (): string => `bull:${QueueName.WORKER_JOBS}:completed`
const failedKey = (): string => `bull:${QueueName.WORKER_JOBS}:failed`

/**
 * Reproduces the seed cause behind the production "stuck-active" zombies:
 *   provisionFlowPieces (or any work between getNextJob and completeJob) takes
 *   longer than `lockDuration` (120s in prod). The Redis lock for the job
 *   expires. By the time the worker calls completeJob with its original token,
 *   BullMQ's moveToFinished Lua script returns `-2 Missing lock`, which the
 *   broker classifies as a "stalled job error" and silently swallows. The job
 *   never receives an LREM from the active list, attemptsMade never increments,
 *   and the job becomes a zombie that the BullMQ 5.61 stalled-scan loop
 *   recycles forever (until our fix in tryDequeue).
 *
 *   This test simulates the > 120s gap by directly DELing the lock key after
 *   the dequeue, then calling completeJob with the (now stale) token.
 */
describe('jobBroker.completeJob — seed cause for stuck-active zombies', () => {
    it('SEED: silently swallows "Missing lock" on moveToCompleted, leaving job in active', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const requestId = apId()

        const jobData = {
            jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
            platformId: mockPlatform.id,
            projectId: mockProject.id,
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            flowId: apId(),
            flowVersionId: apId(),
            test: false,
            hookType: TriggerHookType.ON_ENABLE,
            requestId,
            webserverId: 'seed-cause-test',
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        const polledJob = await jobBroker(app.log).poll()
        expect(polledJob).not.toBeNull()
        expect(polledJob!.jobId).toBe(jobId)

        const redis = await redisConnections.useExisting()

        const lockBefore = await redis.get(lockKey(jobId))
        expect(lockBefore).toBe(polledJob!.token)
        const activeBefore = await redis.lrange(activeKey(), 0, -1)
        expect(activeBefore).toContain(jobId)

        // Simulate cold-cache provisioning (or any > lockDuration delay) that lets
        // the lock TTL expire before completeJob runs.
        const deleted = await redis.del(lockKey(jobId))
        expect(deleted).toBe(1)

        await expect(
            jobBroker(app.log).completeJob({
                jobId,
                token: polledJob!.token,
                queueName: polledJob!.queueName,
                status: EngineResponseStatus.LOG_SIZE_EXCEEDED,
                logs: 'simulated large logs',
            }),
        ).resolves.toBeUndefined()

        const activeAfter = await redis.lrange(activeKey(), 0, -1)
        const completedAfter = await redis.zrange(completedKey(), 0, -1)
        const failedAfter = await redis.zrange(failedKey(), 0, -1)
        const atm = await redis.hget(jobKey(jobId), 'atm')

        expect(activeAfter).toContain(jobId)
        expect(completedAfter).not.toContain(jobId)
        expect(failedAfter).not.toContain(jobId)
        expect(atm == null || atm === '0').toBe(true)

        await redis.lrem(activeKey(), 0, jobId)
        await redis.del(jobKey(jobId))
    })

    it('SEED: same swallow happens on the INTERNAL_ERROR -> moveToFailed path', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const requestId = apId()

        const jobData = {
            jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
            platformId: mockPlatform.id,
            projectId: mockProject.id,
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            flowId: apId(),
            flowVersionId: apId(),
            test: false,
            hookType: TriggerHookType.ON_ENABLE,
            requestId,
            webserverId: 'seed-cause-test-2',
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        const polledJob = await jobBroker(app.log).poll()
        expect(polledJob).not.toBeNull()

        const redis = await redisConnections.useExisting()
        await redis.del(lockKey(jobId))

        await expect(
            jobBroker(app.log).completeJob({
                jobId,
                token: polledJob!.token,
                queueName: polledJob!.queueName,
                status: EngineResponseStatus.INTERNAL_ERROR,
                errorMessage: 'sandbox died during cold-cache provision',
            }),
        ).resolves.toBeUndefined()

        const activeAfter = await redis.lrange(activeKey(), 0, -1)
        const failedAfter = await redis.zrange(failedKey(), 0, -1)
        const atm = await redis.hget(jobKey(jobId), 'atm')

        expect(activeAfter).toContain(jobId)
        expect(failedAfter).not.toContain(jobId)
        expect(atm == null || atm === '0').toBe(true)

        await redis.lrem(activeKey(), 0, jobId)
        await redis.del(jobKey(jobId))
    })

    it('CONTROL: when the lock IS still valid, completeJob removes the job from active and increments atm', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const requestId = apId()

        const jobData = {
            jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
            platformId: mockPlatform.id,
            projectId: mockProject.id,
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            flowId: apId(),
            flowVersionId: apId(),
            test: false,
            hookType: TriggerHookType.ON_ENABLE,
            requestId,
            webserverId: 'seed-cause-control',
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        const polledJob = await jobBroker(app.log).poll()
        expect(polledJob).not.toBeNull()

        const redis = await redisConnections.useExisting()

        await jobBroker(app.log).completeJob({
            jobId,
            token: polledJob!.token,
            queueName: polledJob!.queueName,
            status: EngineResponseStatus.OK,
            response: { ok: true },
        })

        const activeAfter = await redis.lrange(activeKey(), 0, -1)
        expect(activeAfter).not.toContain(jobId)
    })
})
