import { ErrorCode } from '@activepieces/core-utils'
import { FAILED_STATES, FlowRetryStrategy, FlowRun, FlowRunStatus, FlowRunWithRetryError, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

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

describe('Retry from failed step (POST /v1/flow-runs/:id/retry)', () => {
    it.each([
        FlowRunStatus.SUCCEEDED,
        FlowRunStatus.PAUSED,
        FlowRunStatus.CANCELED,
        FlowRunStatus.LOG_SIZE_EXCEEDED,
    ])('refuses a %s run and leaves it unchanged', async (status) => {
        const flowRun = await createRunWithStatus(status)
        const before = await readRun(flowRun.id)

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/retry`, {
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
            projectId: ctx.project.id,
        })

        expect(response.statusCode).toBe(409)
        expect(response.json().code).toBe(ErrorCode.FLOW_RUN_NOT_RETRYABLE)
        const after = await readRun(flowRun.id)
        expect(after.status).toBe(status)
        expect(after.startTime).toEqual(before.startTime)
    })

    it.each([
        ...FAILED_STATES,
        FlowRunStatus.QUEUED,
        FlowRunStatus.RUNNING,
    ])('accepts a %s run and queues it', async (status) => {
        const flowRun = await createRunWithStatus(status)

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/retry`, {
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
            projectId: ctx.project.id,
        })

        expect(response.statusCode).toBe(200)
        const after = await readRun(flowRun.id)
        expect(after.status).toBe(FlowRunStatus.QUEUED)
    })

    it('retry from failed step by filter retries only failed runs', async () => {
        const failedRun = await createRunWithStatus(FlowRunStatus.FAILED)
        const otherRuns = await Promise.all([
            FlowRunStatus.QUEUED,
            FlowRunStatus.RUNNING,
            FlowRunStatus.PAUSED,
            FlowRunStatus.SUCCEEDED,
        ].map((status) => createRunWithStatus(status)))
        const otherRunsBefore = await Promise.all(otherRuns.map((run) => readRun(run.id)))

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId: ctx.project.id,
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
        })

        expect(response.statusCode).toBe(200)
        const results: FlowRunWithRetryError[] = response.json()
        expect(results.map((run) => run.id)).toEqual([failedRun.id])
        expect((await readRun(failedRun.id)).status).toBe(FlowRunStatus.QUEUED)
        const otherRunsAfter = await Promise.all(otherRuns.map((run) => readRun(run.id)))
        expect(otherRunsAfter).toEqual(otherRunsBefore)
    })

    it('retry from failed step by filter keeps only the failed statuses of the status filter', async () => {
        const failedRun = await createRunWithStatus(FlowRunStatus.FAILED)
        const runningRun = await createRunWithStatus(FlowRunStatus.RUNNING)
        const runningBefore = await readRun(runningRun.id)

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId: ctx.project.id,
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
            status: [FlowRunStatus.FAILED, FlowRunStatus.RUNNING],
        })

        expect(response.statusCode).toBe(200)
        const results: FlowRunWithRetryError[] = response.json()
        expect(results.map((run) => run.id)).toEqual([failedRun.id])
        expect(await readRun(runningRun.id)).toEqual(runningBefore)
    })

    it('retry from failed step by filter retries nothing when the status filter has no failed status', async () => {
        const runningRun = await createRunWithStatus(FlowRunStatus.RUNNING)
        const runningBefore = await readRun(runningRun.id)

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId: ctx.project.id,
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
            status: [FlowRunStatus.RUNNING],
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual([])
        expect(await readRun(runningRun.id)).toEqual(runningBefore)
    })

    it('retry from failed step by run ids still accepts a RUNNING run', async () => {
        const runningRun = await createRunWithStatus(FlowRunStatus.RUNNING)

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId: ctx.project.id,
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
            flowRunIds: [runningRun.id],
        })

        expect(response.statusCode).toBe(200)
        const results: FlowRunWithRetryError[] = response.json()
        expect(results.map((run) => ({ id: run.id, error: run.error }))).toEqual([{ id: runningRun.id, error: undefined }])
        expect((await readRun(runningRun.id)).status).toBe(FlowRunStatus.QUEUED)
    })
})

async function createRunWithStatus(status: FlowRunStatus): Promise<FlowRun> {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const flowRun = createMockFlowRun({
        projectId: ctx.project.id,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status,
        environment: RunEnvironment.PRODUCTION,
        created: new Date().toISOString(),
    })
    await db.save('flow_run', flowRun)
    return flowRun
}

async function readRun(id: string): Promise<Pick<FlowRun, 'status' | 'startTime'>> {
    return db.findOneByOrFail<Pick<FlowRun, 'status' | 'startTime'>>('flow_run', { id })
}
