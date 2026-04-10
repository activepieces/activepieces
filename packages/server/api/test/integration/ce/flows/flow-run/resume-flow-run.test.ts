import { apId, ExecutionType, FlowRunStatus, FlowVersionState, PauseType, ProgressUpdateType, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { distributedStore } from '../../../../../src/app/database/redis-connections'
import { pubsub } from '../../../../../src/app/helper/pubsub'
import { engineResponseWatcher } from '../../../../../src/app/workers/engine-response-watcher'
import { redisMetadataKey, RunsMetadataUpsertData } from '../../../../../src/app/workers/job'
import { flowRunSideEffects } from '../../../../../src/app/flows/flow-run/flow-run-side-effects'
import { waitpointService } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-service'
import { WaitpointType } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-types'
import { createHandlers } from '../../../../../src/app/workers/rpc/worker-rpc-service'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { db } from '../../../../helpers/db'

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app)
})

async function createPausedFlowRunWithWaitpoint(params: {
    projectId: string
    pauseRequestId: string
}) {
    const flow = createMockFlow({ projectId: params.projectId })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.LOCKED,
    })
    await db.save('flow_version', flowVersion)

    const flowRun = createMockFlowRun({
        projectId: params.projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.PAUSED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)

    await db.save('waitpoint', {
        id: apId(),
        flowRunId: flowRun.id,
        projectId: params.projectId,
        type: 'WEBHOOK',
        status: 'PENDING',
        httpRequestId: null,
        workerHandlerId: null,
    })

    return { flow, flowVersion, flowRun }
}

describe('Resume flow run', () => {
    it('should resume successfully when flow is PAUSED with a PENDING waitpoint', async () => {
        const requestId = apId()

        const { flowRun } = await createPausedFlowRunWithWaitpoint({
            projectId: ctx.project.id,
            pauseRequestId: requestId,
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${requestId}`,
            body: {
                status: 'success',
                data: { greeting: 'Hello' },
            },
        })

        expect(response.statusCode).toBe(200)

        const waitpoint = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpoint).toBeNull()
    })

    it('should pre-complete waitpoint when flow is RUNNING (race condition)', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const requestId = apId()
        const flowRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status: FlowRunStatus.RUNNING,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', flowRun)

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${requestId}`,
            body: {
                status: 'success',
                data: { greeting: 'Hello' },
            },
        })

        expect(response.statusCode).toBe(200)

        const waitpoint = await db.findOneBy<{ status: string, resumePayload: unknown }>('waitpoint', { flowRunId: flowRun.id })
        expect(waitpoint).not.toBeNull()
        expect(waitpoint!.status).toBe('COMPLETED')
        expect(waitpoint!.resumePayload).toBeDefined()
    })

    it('should trigger resume when uploadRunLog finds a pre-completed waitpoint', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const flowRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status: FlowRunStatus.RUNNING,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', flowRun)

        const runId = flowRun.id
        const requestId = apId()

        await distributedStore.merge(redisMetadataKey(runId), {
            id: runId,
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            status: FlowRunStatus.RUNNING,
        })

        await db.save('waitpoint', {
            id: apId(),
            flowRunId: runId,
            projectId: ctx.project.id,
            type: 'WEBHOOK',
            status: 'COMPLETED',
            resumePayload: {
                payload: { body: { status: 'success' } },
                requestId,
                progressUpdateType: 'TEST_FLOW',
                executionType: 'RESUME',
            },
        })

        const handlers = createHandlers(app.log)
        await handlers.uploadRunLog({
            runId,
            projectId: ctx.project.id,
            status: FlowRunStatus.PAUSED,
            workerHandlerId: null,
            httpRequestId: null,
            pauseMetadata: {
                type: PauseType.WEBHOOK,
                requestId,
                response: {},
            },
        })

        const dbRun = await db.findOneBy<{ id: string, status: string }>('flow_run', { id: runId })
        expect(dbRun).not.toBeNull()

        const waitpoint = await db.findOneBy('waitpoint', { flowRunId: runId })
        expect(waitpoint).toBeNull()
    })

    it('should not resume when flow is in terminal state', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const flowRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status: FlowRunStatus.SUCCEEDED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', flowRun)

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${apId()}`,
            body: { data: 'test' },
        })

        expect(response.statusCode).toBe(200)
    })

    it('sync: should return 400 when no waitpoint exists for PAUSED flow', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const flowRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status: FlowRunStatus.PAUSED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', flowRun)

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${apId()}/sync`,
            body: { data: 'test' },
        })

        expect(response.statusCode).toBe(400)
    })

    it('sync: should accept request when PAUSED with waitpoint', async () => {
        const requestId = apId()

        const { flowRun } = await createPausedFlowRunWithWaitpoint({
            projectId: ctx.project.id,
            pauseRequestId: requestId,
        })

        const responsePromise = app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${requestId}/sync`,
            body: { data: 'test' },
        })

        await new Promise((resolve) => setTimeout(resolve, 500))
        await pubsub.publish(`engine-run:sync:${engineResponseWatcher(app.log).getServerId()}`, JSON.stringify({
            requestId,
            response: { status: 200, body: { ok: true }, headers: {} },
        }))

        const response = await responsePromise
        expect(response.statusCode).toBe(200)
    })

    it('should create a waitpoint when uploadRunLog is called with pauseMetadata for a Redis-only run', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const runId = apId()
        const requestId = apId()

        const runMetadata: RunsMetadataUpsertData = {
            id: runId,
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            status: FlowRunStatus.RUNNING,
        }
        await distributedStore.merge(redisMetadataKey(runId), runMetadata)

        const handlers = createHandlers(app.log)
        await handlers.uploadRunLog({
            runId,
            projectId: ctx.project.id,
            status: FlowRunStatus.PAUSED,
            workerHandlerId: null,
            httpRequestId: null,
            pauseMetadata: {
                type: PauseType.WEBHOOK,
                requestId,
                response: {},
            },
        })

        const waitpoint = await db.findOneBy<{ status: string, type: string }>('waitpoint', { flowRunId: runId })
        expect(waitpoint).not.toBeNull()
        expect(waitpoint!.status).toBe('PENDING')
        expect(waitpoint!.type).toBe('WEBHOOK')

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${runId}/requests/${requestId}`,
            body: { status: 'success', data: { greeting: 'Hello' } },
        })
        expect(response.statusCode).toBe(200)
    })

    it('should create DELAY waitpoint with resumeDateTime via uploadRunLog', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const runId = apId()
        const resumeDateTime = new Date(Date.now() + 60000).toISOString()

        const runMetadata: RunsMetadataUpsertData = {
            id: runId,
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            status: FlowRunStatus.RUNNING,
        }
        await distributedStore.merge(redisMetadataKey(runId), runMetadata)

        const handlers = createHandlers(app.log)
        await handlers.uploadRunLog({
            runId,
            projectId: ctx.project.id,
            status: FlowRunStatus.PAUSED,
            workerHandlerId: null,
            httpRequestId: null,
            pauseMetadata: {
                type: PauseType.DELAY,
                resumeDateTime,
            },
        })

        const waitpoint = await db.findOneBy<{ status: string, type: string, resumeDateTime: string }>('waitpoint', { flowRunId: runId })
        expect(waitpoint).not.toBeNull()
        expect(waitpoint!.type).toBe('DELAY')
        expect(waitpoint!.status).toBe('PENDING')
        expect(new Date(waitpoint!.resumeDateTime).toISOString()).toBe(resumeDateTime)
    })

    it('should clean up waitpoint when flow run finishes (onFinish)', async () => {
        const { flowRun } = await createPausedFlowRunWithWaitpoint({
            projectId: ctx.project.id,
            pauseRequestId: apId(),
        })

        const waitpointBefore = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointBefore).not.toBeNull()

        await db.update('flow_run', flowRun.id, { status: FlowRunStatus.SUCCEEDED })
        const updatedRun = await db.findOneByOrFail<{ id: string, status: string, projectId: string }>('flow_run', { id: flowRun.id })
        await flowRunSideEffects(app.log).onFinish(updatedRun as any)

        const waitpointAfter = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointAfter).toBeNull()
    })

    it('markParentRunAsFailed should complete waitpoint when parent is PAUSED', async () => {
        const { flowRun: parentRun } = await createPausedFlowRunWithWaitpoint({
            projectId: ctx.project.id,
            pauseRequestId: apId(),
        })

        const childRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: parentRun.flowId,
            flowVersionId: parentRun.flowVersionId,
            status: FlowRunStatus.FAILED,
            environment: RunEnvironment.PRODUCTION,
            parentRunId: parentRun.id,
            failParentOnFailure: true,
        })
        await db.save('flow_run', childRun)

        await waitpointService(app.log).complete({
            flowRunId: parentRun.id,
            projectId: ctx.project.id,
            resumePayload: {
                payload: { body: { status: 'error', data: { message: 'Subflow execution failed' } } },
                progressUpdateType: ProgressUpdateType.TEST_FLOW,
                executionType: ExecutionType.RESUME,
            },
        })

        const waitpoint = await db.findOneBy<{ status: string, resumePayload: unknown }>('waitpoint', { flowRunId: parentRun.id })
        expect(waitpoint).not.toBeNull()
        expect(waitpoint!.status).toBe('COMPLETED')
    })

    it('markParentRunAsFailed should pre-complete when parent has NOT paused yet', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const parentRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status: FlowRunStatus.RUNNING,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', parentRun)

        await waitpointService(app.log).complete({
            flowRunId: parentRun.id,
            projectId: ctx.project.id,
            resumePayload: {
                payload: { body: { status: 'error', data: { message: 'Subflow execution failed' } } },
                progressUpdateType: ProgressUpdateType.TEST_FLOW,
                executionType: ExecutionType.RESUME,
            },
        })

        const waitpoint = await db.findOneBy<{ status: string }>('waitpoint', { flowRunId: parentRun.id })
        expect(waitpoint).not.toBeNull()
        expect(waitpoint!.status).toBe('COMPLETED')

        await distributedStore.merge(redisMetadataKey(parentRun.id), {
            id: parentRun.id,
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            status: FlowRunStatus.RUNNING,
        })

        const handlers = createHandlers(app.log)
        await handlers.uploadRunLog({
            runId: parentRun.id,
            projectId: ctx.project.id,
            status: FlowRunStatus.PAUSED,
            workerHandlerId: null,
            httpRequestId: null,
            pauseMetadata: {
                type: PauseType.WEBHOOK,
                requestId: apId(),
                response: {},
            },
        })

        const waitpointAfter = await db.findOneBy('waitpoint', { flowRunId: parentRun.id })
        expect(waitpointAfter).toBeNull()
    })

    it('should not create orphaned waitpoint when parent is already in terminal state', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const parentRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status: FlowRunStatus.FAILED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', parentRun)

        await waitpointService(app.log).complete({
            flowRunId: parentRun.id,
            projectId: ctx.project.id,
            resumePayload: {
                payload: { body: { status: 'error', data: { message: 'Subflow execution failed' } } },
                progressUpdateType: ProgressUpdateType.TEST_FLOW,
                executionType: ExecutionType.RESUME,
            },
        })

        const waitpoint = await db.findOneBy('waitpoint', { flowRunId: parentRun.id })
        expect(waitpoint).not.toBeNull()

        await waitpointService(app.log).deleteByFlowRunId(parentRun.id)

        await waitpointService(app.log).handleResumeSignal({
            flowRunId: parentRun.id,
            flowRunStatus: FlowRunStatus.FAILED,
            projectId: ctx.project.id,
            resumeData: {
                payload: { body: { status: 'error' } },
                progressUpdateType: ProgressUpdateType.TEST_FLOW,
                executionType: ExecutionType.RESUME,
            },
            onReady: async () => {
                throw new Error('onReady should not be called for terminal state')
            },
        })

        const orphanedWaitpoint = await db.findOneBy('waitpoint', { flowRunId: parentRun.id })
        expect(orphanedWaitpoint).toBeNull()
    })
})
