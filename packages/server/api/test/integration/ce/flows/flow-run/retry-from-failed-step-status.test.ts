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

    it('bulk retry without run ids retries the failed run and reports the paused one', async () => {
        const failedRun = await createRunWithStatus(FlowRunStatus.FAILED)
        const pausedRun = await createRunWithStatus(FlowRunStatus.PAUSED)

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId: ctx.project.id,
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
        })

        expect(response.statusCode).toBe(200)
        const results: FlowRunWithRetryError[] = response.json()
        const pausedResult = results.find((run) => run.id === pausedRun.id)
        const failedResult = results.find((run) => run.id === failedRun.id)
        expect(pausedResult?.error?.errorCode).toBe(ErrorCode.FLOW_RUN_NOT_RETRYABLE)
        expect(failedResult?.error).toBeUndefined()
        expect((await readRun(pausedRun.id)).status).toBe(FlowRunStatus.PAUSED)
        expect((await readRun(failedRun.id)).status).toBe(FlowRunStatus.QUEUED)
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
