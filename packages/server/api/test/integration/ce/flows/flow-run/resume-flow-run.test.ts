import { apId, FlowRunStatus, FlowVersionState, PauseType, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { distributedStore } from '../../../../../src/app/database/redis-connections'
import { pubsub } from '../../../../../src/app/helper/pubsub'
import { engineResponseWatcher } from '../../../../../src/app/workers/engine-response-watcher'
import { redisMetadataKey, RunsMetadataUpsertData } from '../../../../../src/app/workers/job'
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

async function createPausedFlowRun(params: {
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

    // Set pauseMetadata via update since createMockFlowRun doesn't support it
    await db.update('flow_run', flowRun.id, {
        pauseMetadata: {
            type: PauseType.WEBHOOK,
            requestId: params.pauseRequestId,
            response: {},
        },
    })

    return { flow, flowVersion, flowRun }
}

describe('Resume flow run', () => {
    it('should resume successfully when requestId matches DB pauseMetadata', async () => {
        const correctRequestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: correctRequestId,
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${correctRequestId}`,
            body: {
                status: 'success',
                data: { greeting: 'Hello' },
            },
        })

        expect(response.statusCode).toBe(200)
    })

    it('should resume when pauseMetadata appears in DB after a short delay (race condition)', async () => {
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

        // Simulate the engine committing pauseMetadata after a short delay
        setTimeout(async () => {
            await db.update('flow_run', flowRun.id, {
                status: FlowRunStatus.PAUSED,
                pauseMetadata: {
                    type: PauseType.WEBHOOK,
                    requestId,
                    response: {},
                },
            })
        }, 500)

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${requestId}`,
            body: {
                status: 'success',
                data: { greeting: 'Hello' },
            },
        })

        expect(response.statusCode).toBe(200)
    })

    it('should not resume when requestId mismatches DB', async () => {
        const dbRequestId = apId()
        const unknownRequestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: dbRequestId,
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${unknownRequestId}`,
            body: {
                status: 'success',
                data: { greeting: 'Hello' },
            },
        })

        // The run was not actually resumed (returned as-is), verify it's still PAUSED
        const run = await db.findOneByOrFail<{ status: string }>('flow_run', { id: flowRun.id })
        expect(run.status).toBe(FlowRunStatus.PAUSED)
    })

    it('sync: should return 404 when requestId mismatches DB', async () => {
        const dbRequestId = apId()
        const unknownRequestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: dbRequestId,
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${unknownRequestId}/sync`,
            body: { data: 'test' },
        })

        expect(response.statusCode).toBe(404)
    })

    it('should persist pauseMetadata to DB when run only exists in Redis (race condition)', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)

        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
        })
        await db.save('flow_version', flowVersion)

        const runId = apId()
        const requestId = apId()

        // Simulate queueOrCreateInstantly: run metadata is in Redis but NOT in DB
        const runMetadata: RunsMetadataUpsertData = {
            id: runId,
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            status: FlowRunStatus.RUNNING,
        }
        await distributedStore.merge(redisMetadataKey(runId), runMetadata)

        // Call uploadRunLog with pauseMetadata — run does NOT exist in DB yet
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

        // Verify the run was force-flushed to DB with pauseMetadata
        const dbRun = await db.findOneBy<{ id: string, status: string, pauseMetadata: unknown }>('flow_run', { id: runId })
        expect(dbRun).not.toBeNull()
        expect(dbRun!.status).toBe(FlowRunStatus.PAUSED)
        expect(dbRun!.pauseMetadata).toEqual(expect.objectContaining({
            type: PauseType.WEBHOOK,
            requestId,
        }))

        // Verify resume endpoint works with the persisted pauseMetadata
        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${runId}/requests/${requestId}`,
            body: {
                status: 'success',
                data: { greeting: 'Hello' },
            },
        })
        expect(response.statusCode).toBe(200)
    })

    it('sync: should accept request when DB has matching requestId', async () => {
        const requestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: requestId,
        })

        // Publish a mock engine response right after injection starts,
        // so the sync handler's oneTimeListener resolves immediately.
        const responsePromise = app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${requestId}/sync`,
            body: { data: 'test' },
        })

        // Small delay to let the handler register its listener before we publish
        await new Promise((resolve) => setTimeout(resolve, 500))
        await pubsub.publish(`engine-run:sync:${engineResponseWatcher(app.log).getServerId()}`, JSON.stringify({
            requestId,
            response: { status: 200, body: { ok: true }, headers: {} },
        }))

        const response = await responsePromise
        expect(response.statusCode).toBe(200)
    })
})
