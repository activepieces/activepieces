import { apId, FlowRun, FlowRunStatus, FlowVersionState, PauseType, RunEnvironment } from '@activepieces/shared'
import { redisMetadataKey } from '../../../../../src/app/workers/job'
import { FastifyInstance } from 'fastify'
import { distributedStore } from '../../../../../src/app/database/redis-connections'
import { pubsub } from '../../../../../src/app/helper/pubsub'
import { engineResponseWatcher } from '../../../../../src/app/workers/engine-response-watcher'
import * as flowRunServiceModule from '../../../../../src/app/flows/flow-run/flow-run-service'
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

describe('Resume flow run — subflow race condition (Redis metadata fallback)', () => {
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

    it('should resume successfully when DB is stale but Redis metadata hash has matching requestId', async () => {
        const staleRequestId = apId()
        const newRequestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: staleRequestId,
        })

        // Simulate the race: engine wrote new pauseMetadata to Redis hash
        // but the metadata worker hasn't persisted it to DB yet
        await distributedStore.merge(redisMetadataKey(flowRun.id), {
            pauseMetadata: {
                type: PauseType.WEBHOOK,
                requestId: newRequestId,
                response: {},
            },
        })

        // Child flow calls back with the NEW requestId — should succeed via Redis fallback
        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${newRequestId}`,
            body: {
                status: 'success',
                data: { greeting: 'Hello' },
            },
        })

        expect(response.statusCode).toBe(200)
    })

    it('should resume when pauseMetadata is null in DB (first-time pause)', async () => {
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
        // No pauseMetadata set — isNil(pauseMetadata) → matchRequestId is true

        const requestId = apId()
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

    it('should not resume when requestId mismatches both DB and Redis', async () => {
        const dbRequestId = apId()
        const redisRequestId = apId()
        const unknownRequestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: dbRequestId,
        })

        // Redis hash has a different requestId than what the callback provides
        await distributedStore.merge(redisMetadataKey(flowRun.id), {
            pauseMetadata: {
                type: PauseType.WEBHOOK,
                requestId: redisRequestId,
                response: {},
            },
        })

        // Callback with an unknown requestId — should not resume
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

    it('should resume via DB re-read when worker consumes Redis between first DB read and Redis read', async () => {
        const staleRequestId = apId()
        const newRequestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: newRequestId,
        })

        // Redis is empty — simulates worker having already consumed it
        // (no distributedStore.merge call)

        // Spy on flowRunRepo to return stale pauseMetadata on the FIRST
        // createQueryBuilder().getOne() call, simulating the DB read before
        // the worker persisted. The second call (re-read) returns real data.
        const realRepo = flowRunServiceModule.flowRunRepo()
        const originalCreateQB = realRepo.createQueryBuilder.bind(realRepo)
        let queryBuilderCallCount = 0
        const spy = vi.spyOn(realRepo, 'createQueryBuilder').mockImplementation((...args: Parameters<typeof realRepo.createQueryBuilder>) => {
            const qb = originalCreateQB(...args)
            queryBuilderCallCount++
            if (queryBuilderCallCount === 1) {
                const originalGetOne = qb.getOne.bind(qb)
                qb.getOne = async () => {
                    const result = await originalGetOne()
                    if (result) {
                        return {
                            ...result,
                            pauseMetadata: {
                                type: PauseType.WEBHOOK,
                                requestId: staleRequestId,
                                response: {},
                            },
                        } as FlowRun
                    }
                    return result
                }
            }
            // Second call (re-read) returns real DB data with newRequestId
            return qb
        })

        try {
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/flow-runs/${flowRun.id}/requests/${newRequestId}`,
                body: {
                    status: 'success',
                    data: { greeting: 'Hello' },
                },
            })

            expect(response.statusCode).toBe(200)
            // Must have called createQueryBuilder twice (first read + re-read)
            expect(queryBuilderCallCount).toBe(2)
        }
        finally {
            spy.mockRestore()
        }
    })

    it('sync: should return 404 when requestId mismatches both DB and Redis', async () => {
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

    it('sync: should accept request when DB is stale but Redis has matching requestId', async () => {
        const staleRequestId = apId()
        const newRequestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: staleRequestId,
        })

        await distributedStore.merge(redisMetadataKey(flowRun.id), {
            pauseMetadata: {
                type: PauseType.WEBHOOK,
                requestId: newRequestId,
                response: {},
            },
        })

        // Publish a mock engine response right after injection starts,
        // so the sync handler's oneTimeListener resolves immediately.
        const responsePromise = app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${newRequestId}/sync`,
            body: { data: 'test' },
        })

        // Small delay to let the handler register its listener before we publish
        await new Promise((resolve) => setTimeout(resolve, 500))
        await pubsub.publish(`engine-run:sync:${engineResponseWatcher(app.log).getServerId()}`, JSON.stringify({
            requestId: newRequestId,
            response: { status: 200, body: { ok: true }, headers: {} },
        }))

        const response = await responsePromise
        expect(response.statusCode).toBe(200)
    })

    it('should not resume when Redis metadata hash has no pauseMetadata and DB mismatches', async () => {
        const staleRequestId = apId()
        const newRequestId = apId()

        const { flowRun } = await createPausedFlowRun({
            projectId: ctx.project.id,
            pauseRequestId: staleRequestId,
        })

        // Redis hash exists but has no pauseMetadata (e.g. only status was written)
        await distributedStore.merge(redisMetadataKey(flowRun.id), {
            status: FlowRunStatus.PAUSED,
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/requests/${newRequestId}`,
            body: {
                status: 'success',
                data: { greeting: 'Hello' },
            },
        })

        // Run should still be PAUSED — resume was not processed
        const run = await db.findOneByOrFail<{ status: string }>('flow_run', { id: flowRun.id })
        expect(run.status).toBe(FlowRunStatus.PAUSED)
    })
})
