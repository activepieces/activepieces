import { apId } from '@activepieces/core-utils'
import { apVersionUtil } from '@activepieces/server-utils'
import { LATEST_JOB_DATA_SCHEMA_VERSION, TriggerHookType, WorkerJobType, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { engineResponseWatcher } from '../../../../src/app/workers/engine-response-watcher'
import { jobBroker } from '../../../../src/app/workers/job-queue/job-broker'
import { jobQueue, JobType } from '../../../../src/app/workers/job-queue/job-queue'
import { workerMachineCache } from '../../../../src/app/workers/machine/machine-cache'
import { createHandlers } from '../../../../src/app/workers/rpc/worker-rpc-service'
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

function healthcheck(overrides: { workerId: string, egressStatus?: 'ok' | 'unavailable' }): WorkerMachineHealthcheckRequest {
    return {
        workerId: overrides.workerId,
        cpuUsagePercentage: 0,
        ramUsagePercentage: 0,
        totalAvailableRamInBytes: 8 * 1024 * 1024 * 1024,
        totalCpuCores: 4,
        ip: '127.0.0.1',
        diskInfo: { total: 100, free: 100, used: 0, percentage: 0 },
        sandboxes: [],
        workerProps: {
            version: apVersionUtil.getCurrentRelease(),
            ...(overrides.egressStatus ? { egressStatus: overrides.egressStatus } : {}),
        },
    }
}

describe('Worker poll egress gate', () => {
    it('withholds a queued job from an egress-unavailable worker but records its verdict, then serves the job once egress is ok', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: {
                jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                flowId: apId(),
                flowVersionId: apId(),
                test: false,
                hookType: TriggerHookType.ON_ENABLE,
                requestId: apId(),
                webserverId: engineResponseWatcher(app.log).getServerId(),
            },
        })

        const handlers = createHandlers(app.log)
        const unavailableWorkerId = apId()

        const withheld = await handlers.poll(healthcheck({ workerId: unavailableWorkerId, egressStatus: 'unavailable' }))
        expect(withheld).toBeNull()
        const recorded = await workerMachineCache().findOne(unavailableWorkerId)
        expect(recorded?.information.workerProps.egressStatus).toBe('unavailable')

        const served = await handlers.poll(healthcheck({ workerId: apId(), egressStatus: 'ok' }))
        expect(served?.jobId).toBe(jobId)
    })
})
