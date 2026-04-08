import { FastifyInstance } from 'fastify'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { jobBroker } from '../../../../src/app/workers/job-queue/job-broker'
import { jobQueue, JobType } from '../../../../src/app/workers/job-queue/job-queue'
import { engineResponseWatcher } from '../../../../src/app/workers/engine-response-watcher'
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

describe('Job broker error propagation', () => {
    it('should propagate INTERNAL_ERROR with errorMessage through engine response watcher', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const requestId = apId()
        const webserverId = engineResponseWatcher(app.log).getServerId()

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
            webserverId,
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        const polledJob = await jobBroker(app.log).poll()
        expect(polledJob).not.toBeNull()

        const listenerPromise = engineResponseWatcher(app.log).oneTimeListener(
            requestId,
            true,
            5000,
            undefined,
        )

        await jobBroker(app.log).completeJob({
            jobId,
            token: polledJob!.token,
            queueName: polledJob!.queueName,
            status: EngineResponseStatus.INTERNAL_ERROR,
            errorMessage: 'Sandbox timeout',
        })

        const result = await listenerPromise
        expect(result).toEqual({
            status: EngineResponseStatus.INTERNAL_ERROR,
            response: undefined,
            error: 'Sandbox timeout',
        })
    })

    it('should use default error message when INTERNAL_ERROR has no errorMessage', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const requestId = apId()
        const webserverId = engineResponseWatcher(app.log).getServerId()

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
            webserverId,
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        const polledJob = await jobBroker(app.log).poll()
        expect(polledJob).not.toBeNull()

        const listenerPromise = engineResponseWatcher(app.log).oneTimeListener(
            requestId,
            true,
            5000,
            undefined,
        )

        await jobBroker(app.log).completeJob({
            jobId,
            token: polledJob!.token,
            queueName: polledJob!.queueName,
            status: EngineResponseStatus.INTERNAL_ERROR,
        })

        const result = await listenerPromise
        expect(result).toEqual({
            status: EngineResponseStatus.INTERNAL_ERROR,
            response: undefined,
            error: 'Internal error',
        })
    })

    it('should treat USER_FAILURE as completed and propagate error through engine response watcher', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const requestId = apId()
        const webserverId = engineResponseWatcher(app.log).getServerId()

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
            webserverId,
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        const polledJob = await jobBroker(app.log).poll()
        expect(polledJob).not.toBeNull()

        const listenerPromise = engineResponseWatcher(app.log).oneTimeListener(
            requestId,
            true,
            5000,
            undefined,
        )

        await jobBroker(app.log).completeJob({
            jobId,
            token: polledJob!.token,
            queueName: polledJob!.queueName,
            status: EngineResponseStatus.USER_FAILURE,
            errorMessage: 'Connection expired',
        })

        const result = await listenerPromise
        expect(result).toEqual({
            status: EngineResponseStatus.USER_FAILURE,
            response: undefined,
            error: 'Connection expired',
        })
    })

    it('should pass through USER_FAILURE response payload when provided', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const requestId = apId()
        const webserverId = engineResponseWatcher(app.log).getServerId()

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
            webserverId,
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        const polledJob = await jobBroker(app.log).poll()
        expect(polledJob).not.toBeNull()

        const listenerPromise = engineResponseWatcher(app.log).oneTimeListener(
            requestId,
            true,
            5000,
            undefined,
        )

        await jobBroker(app.log).completeJob({
            jobId,
            token: polledJob!.token,
            queueName: polledJob!.queueName,
            status: EngineResponseStatus.USER_FAILURE,
            errorMessage: 'Bad API key',
            response: { message: 'Invalid credentials' },
        })

        const result = await listenerPromise
        expect(result).toEqual({
            status: EngineResponseStatus.USER_FAILURE,
            response: { message: 'Invalid credentials' },
            error: 'Bad API key',
        })
    })

    it('should pass through OK response as-is (regression guard)', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const requestId = apId()
        const webserverId = engineResponseWatcher(app.log).getServerId()

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
            webserverId,
        }

        const jobId = apId()
        await jobQueue(app.log).add({
            type: JobType.ONE_TIME,
            id: jobId,
            data: jobData,
        })

        const polledJob = await jobBroker(app.log).poll()
        expect(polledJob).not.toBeNull()

        const listenerPromise = engineResponseWatcher(app.log).oneTimeListener(
            requestId,
            true,
            5000,
            undefined,
        )

        await jobBroker(app.log).completeJob({
            jobId,
            token: polledJob!.token,
            queueName: polledJob!.queueName,
            status: EngineResponseStatus.OK,
            response: { message: 'trigger enabled' },
        })

        const result = await listenerPromise
        expect(result).toEqual({
            status: EngineResponseStatus.OK,
            response: { message: 'trigger enabled' },
        })
    })
})
