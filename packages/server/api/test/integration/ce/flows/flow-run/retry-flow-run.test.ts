import { FlowRetryStrategy, FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
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

async function createFailedFlowRun(params: {
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
        status: FlowRunStatus.FAILED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)

    return { flow, flowVersion, flowRun }
}

describe('Retry flow run', () => {
    it('should retry from failed step and transition to queued status', async () => {
        const { flowRun } = await createFailedFlowRun({
            projectId: ctx.project.id,
        })

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/retry`, {
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
            projectId: ctx.project.id,
        })

        expect(response.statusCode).toBe(200)

        const updatedRun = await db.findOneByOrFail<{ id: string, status: string }>('flow_run', { id: flowRun.id })
        expect(updatedRun.status).toBe(FlowRunStatus.QUEUED)
    })

    it('should retry on latest version and create a new run', async () => {
        const { flowRun } = await createFailedFlowRun({
            projectId: ctx.project.id,
        })

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/retry`, {
            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
            projectId: ctx.project.id,
        })

        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body.id).not.toBe(flowRun.id)
        expect(body.flowId).toBe(flowRun.flowId)
    })

    it('should return 400 for invalid flow run id', async () => {
        const response = await ctx.post('/v1/flow-runs/non-existent-id/retry', {
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
            projectId: ctx.project.id,
        })

        expect(response.statusCode).toBe(400)
    })
})
