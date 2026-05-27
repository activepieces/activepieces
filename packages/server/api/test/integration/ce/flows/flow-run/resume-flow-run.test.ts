import { apId, ExecutionType, FlowRunStatus, FlowVersionState, StreamStepProgress, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { distributedStore } from '../../../../../src/app/database/redis-connections'
import { pubsub } from '../../../../../src/app/helper/pubsub'
import { engineResponseWatcher } from '../../../../../src/app/workers/engine-response-watcher'
import { redisMetadataKey, RunsMetadataUpsertData } from '../../../../../src/app/workers/job'
import { batchDeleteByFlowId } from '../../../../../src/app/flows/flow/flow.jobs'
import { flowRunSideEffects } from '../../../../../src/app/flows/flow-run/flow-run-side-effects'
import { waitpointService } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-service'
import { createHandlers } from '../../../../../src/app/workers/rpc/worker-rpc-service'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { db } from '../../../../helpers/db'

async function waitForCondition(fn: () => Promise<boolean>, timeoutMs = 5000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        if (await fn()) {
            return
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error('waitForCondition timed out')
}

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
        stepName: 'approval',
        type: 'WEBHOOK',
        status: 'PENDING',
        httpRequestId: null,
        workerHandlerId: null,
    })

    return { flow, flowVersion, flowRun }
}

describe('Resume flow run', () => {
    it('should resume legacy PAUSED flow with no waitpoint via async endpoint', async () => {
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
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${apId()}`,
            body: { data: 'test' },
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({
            message: 'Your response has been recorded. You can close this page now.',
        })
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
            stepName: 'approval',
            type: 'WEBHOOK',
            status: 'COMPLETED',
            resumePayload: {
                payload: { body: { status: 'success' } },
                progressUpdateType: 'TEST_FLOW',
                executionType: 'RESUME',
            },
        })

        const handlers = createHandlers(app.log)
        await handlers.uploadRunLog({
            runId,
            projectId: ctx.project.id,
            status: FlowRunStatus.PAUSED,
        })

        await waitForCondition(async () => {
            const wp = await db.findOneBy('waitpoint', { flowRunId: runId })
            return wp === null
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

    it('sync: should resume legacy PAUSED flow with no waitpoint', async () => {
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
            status: FlowRunStatus.PAUSED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', flowRun)

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

    it('should persist PAUSED status for a Redis-only run', async () => {
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

        await db.save('waitpoint', {
            id: apId(),
            flowRunId: runId,
            projectId: ctx.project.id,
            stepName: 'approval',
            type: 'WEBHOOK',
            status: 'PENDING',
            httpRequestId: null,
            workerHandlerId: null,
        })

        const handlers = createHandlers(app.log)
        await handlers.uploadRunLog({
            runId,
            projectId: ctx.project.id,
            status: FlowRunStatus.PAUSED,
        })

        await waitForCondition(async () => {
            const dbRun = await db.findOneBy<{ status: string }>('flow_run', { id: runId })
            return dbRun?.status === FlowRunStatus.PAUSED
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

    it('should persist DELAY waitpoint with waitpointId via uploadRunLog', async () => {
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

        await db.save('waitpoint', {
            id: apId(),
            flowRunId: runId,
            projectId: ctx.project.id,
            stepName: 'delay_step',
            type: 'DELAY',
            status: 'PENDING',
            resumeDateTime,
            httpRequestId: null,
            workerHandlerId: null,
        })

        const handlers = createHandlers(app.log)
        await handlers.uploadRunLog({
            runId,
            projectId: ctx.project.id,
            status: FlowRunStatus.PAUSED,
        })

        await waitForCondition(async () => {
            const dbRun = await db.findOneBy<{ status: string }>('flow_run', { id: runId })
            return dbRun?.status === FlowRunStatus.PAUSED
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

        const existingWaitpoint = await db.findOneBy<{ id: string }>('waitpoint', { flowRunId: parentRun.id })
        await waitpointService(app.log).complete({
            flowRunId: parentRun.id,
            projectId: ctx.project.id,
            waitpointId: existingWaitpoint!.id,
            resumePayload: {
                payload: { body: { status: 'error', data: { message: 'Subflow execution failed' } } },
                streamStepProgress: StreamStepProgress.WEBSOCKET,
                executionType: ExecutionType.RESUME,
            },
        })

        const waitpoint = await db.findOneBy<{ status: string, resumePayload: unknown }>('waitpoint', { flowRunId: parentRun.id })
        expect(waitpoint).not.toBeNull()
        expect(waitpoint!.status).toBe('COMPLETED')
    })

    it('markParentRunAsFailed should drop the failure when parent has no PENDING waitpoint (regression: subflow retry must not hijack a future pause)', async () => {
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

        const result = await waitpointService(app.log).complete({
            flowRunId: parentRun.id,
            projectId: ctx.project.id,
            waitpointId: apId(),
            resumePayload: {
                payload: { body: { status: 'error', data: { message: 'Subflow execution failed' } } },
                streamStepProgress: StreamStepProgress.WEBSOCKET,
                executionType: ExecutionType.RESUME,
            },
        })

        expect(result.completedExisting).toBe(false)
        expect(result.waitpoint).toBeNull()

        const waitpoint = await db.findOneBy('waitpoint', { flowRunId: parentRun.id })
        expect(waitpoint).toBeNull()
    })

    it('should drop stale resume signal when parent is already in terminal state and not produce a buffered waitpoint', async () => {
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

        const result = await waitpointService(app.log).complete({
            flowRunId: parentRun.id,
            projectId: ctx.project.id,
            waitpointId: apId(),
            resumePayload: {
                payload: { body: { status: 'error', data: { message: 'Subflow execution failed' } } },
                streamStepProgress: StreamStepProgress.WEBSOCKET,
                executionType: ExecutionType.RESUME,
            },
        })
        expect(result.completedExisting).toBe(false)
        expect(result.waitpoint).toBeNull()

        await waitpointService(app.log).handleResumeSignal({
            flowRunId: parentRun.id,
            waitpointId: apId(),
            flowRunStatus: FlowRunStatus.FAILED,
            projectId: ctx.project.id,
            resumePayload: { body: { status: 'error' } },
            onReady: async () => {
                throw new Error('onReady should not be called for terminal state')
            },
        })

        const orphanedWaitpoint = await db.findOneBy('waitpoint', { flowRunId: parentRun.id })
        expect(orphanedWaitpoint).toBeNull()
    })

    it('should resume via new /:id/waitpoints/:waitpointId route', async () => {
        const { flowRun } = await createPausedFlowRunWithWaitpoint({
            projectId: ctx.project.id,
        })

        const waitpoint = await db.findOneBy<{ id: string }>('waitpoint', { flowRunId: flowRun.id })
        expect(waitpoint).not.toBeNull()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/waitpoints/${waitpoint!.id}`,
            body: { status: 'success', data: { greeting: 'Hello' } },
        })

        expect(response.statusCode).toBe(200)

        const waitpointAfter = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointAfter).toBeNull()
    })

    it('should return stale message on double resume via waitpoint route', async () => {
        const { flowRun } = await createPausedFlowRunWithWaitpoint({
            projectId: ctx.project.id,
        })

        const waitpoint = await db.findOneBy<{ id: string }>('waitpoint', { flowRunId: flowRun.id })
        expect(waitpoint).not.toBeNull()

        const firstResponse = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/waitpoints/${waitpoint!.id}`,
            body: { status: 'success', data: { greeting: 'Hello' } },
        })
        expect(firstResponse.statusCode).toBe(200)
        expect(firstResponse.json()).toEqual({
            message: 'Your response has been recorded. You can close this page now.',
        })

        const secondResponse = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/waitpoints/${waitpoint!.id}`,
            body: { status: 'success', data: { greeting: 'Hello again' } },
        })
        expect(secondResponse.statusCode).toBe(200)
        expect(secondResponse.json()).toEqual({
            message: 'This link has expired. The action may have already been processed.',
        })

        const waitpointAfter = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointAfter).toBeNull()
    })

    it('should clean up waitpoints when flow is deleted via batchDeleteByFlowId', async () => {
        const { flowRun, flow } = await createPausedFlowRunWithWaitpoint({
            projectId: ctx.project.id,
        })

        const waitpointBefore = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointBefore).not.toBeNull()

        await batchDeleteByFlowId(flow.id)

        const waitpointAfter = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointAfter).toBeNull()

        const runAfter = await db.findOneBy('flow_run', { id: flowRun.id })
        expect(runAfter).toBeNull()
    })

    it('V0 async: should resume via waitpoint path when V0 waitpoint exists', async () => {
        const { flowRun } = await createPausedFlowRunWithWaitpoint({
            projectId: ctx.project.id,
        })

        const waitpointBefore = await db.findOneBy<{ id: string }>('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointBefore).not.toBeNull()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${apId()}`,
            body: { status: 'approved' },
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({
            message: 'Your response has been recorded. You can close this page now.',
        })

        const waitpointAfter = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointAfter).toBeNull()
    })

    it('V0 async: should take legacy path when only V1 waitpoint exists', async () => {
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

        const waitpointId = apId()
        await db.save('waitpoint', {
            id: waitpointId,
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'approval',
            type: 'WEBHOOK',
            version: 'V1',
            status: 'PENDING',
            httpRequestId: null,
            workerHandlerId: null,
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${apId()}`,
            body: { status: 'approved' },
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({
            message: 'Your response has been recorded. You can close this page now.',
        })

        const waitpointAfter = await db.findOneBy<{ id: string, version: string }>('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointAfter).not.toBeNull()
        expect(waitpointAfter!.id).toBe(waitpointId)
        expect(waitpointAfter!.version).toBe('V1')
    })

    it('V0 sync: should return 409 when flow run is in terminal state', async () => {
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
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${apId()}/sync`,
            body: { data: 'test' },
        })

        expect(response.statusCode).toBe(409)
        expect(response.json()).toEqual(expect.objectContaining({
            message: 'Flow run is not paused',
        }))
    })

    it('V0 sync: should resume via waitpoint path when V0 waitpoint exists', async () => {
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

        const waitpointId = apId()
        const workerHandlerId = engineResponseWatcher(app.log).getServerId()
        await db.save('waitpoint', {
            id: waitpointId,
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'approval',
            type: 'WEBHOOK',
            status: 'PENDING',
            workerHandlerId,
            httpRequestId: null,
        })

        const responsePromise = app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${apId()}/sync`,
            body: { data: 'test' },
        })

        await new Promise((resolve) => setTimeout(resolve, 500))

        await pubsub.publish(`engine-run:sync:${engineResponseWatcher(app.log).getServerId()}`, JSON.stringify({
            requestId: workerHandlerId,
            response: { status: 200, body: { ok: true }, headers: {} },
        }))

        const response = await responsePromise
        expect(response.statusCode).toBe(200)

        const waitpointAfter = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpointAfter).toBeNull()
    })
})
