import { FastifyInstance } from 'fastify'
import { apId, FileCompression, FileLocation, FileType, FlowActionType, FlowRunStatus, RunEnvironment, StepOutputStatus } from '@activepieces/shared'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { describeWithAuth } from '../../../../helpers/describe-with-auth'
import { createMockFile, createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { db } from '../../../../helpers/db'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

function createLogFile(projectId: string, platformId: string, steps: Record<string, unknown>) {
    const data = Buffer.from(JSON.stringify({ executionState: { steps, tags: [] } }))
    return createMockFile({
        projectId,
        platformId,
        type: FileType.FLOW_RUN_LOG,
        compression: FileCompression.NONE,
        location: FileLocation.DB,
        data,
        size: data.length,
    })
}

const SAMPLE_STEPS = {
    trigger: {
        type: 'EMPTY',
        status: StepOutputStatus.SUCCEEDED,
        input: { key: 'in' },
        output: { key: 'out' },
        duration: 10,
    },
    step_1: {
        type: FlowActionType.CODE,
        status: StepOutputStatus.SUCCEEDED,
        input: { code: 'console.log("hello")' },
        output: { result: 'hello' },
        duration: 200,
    },
    loop_1: {
        type: FlowActionType.LOOP_ON_ITEMS,
        status: StepOutputStatus.SUCCEEDED,
        input: { items: [1, 2] },
        output: {
            item: 2,
            index: 1,
            iterations: [
                {
                    inner_step: {
                        type: FlowActionType.CODE,
                        status: StepOutputStatus.SUCCEEDED,
                        input: { val: 1 },
                        output: { result: 'iteration-0' },
                        duration: 50,
                    },
                },
                {
                    inner_step: {
                        type: FlowActionType.CODE,
                        status: StepOutputStatus.SUCCEEDED,
                        input: { val: 2 },
                        output: { result: 'iteration-1' },
                        duration: 60,
                    },
                },
            ],
        },
        duration: 120,
    },
}

async function createRunWithSteps(ctx: { project: { id: string }, platform: { id: string } }) {
    const logFile = createLogFile(ctx.project.id, ctx.platform.id, SAMPLE_STEPS)
    await db.save('file', logFile)

    const mockFlow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', mockFlow)

    const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', mockFlowVersion)

    const mockRun = createMockFlowRun({
        projectId: ctx.project.id,
        flowId: mockFlow.id,
        flowVersionId: mockFlowVersion.id,
        logsFileId: logFile.id,
        status: FlowRunStatus.SUCCEEDED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', mockRun)
    return mockRun
}

describeWithAuth('Get step output endpoint', () => app!, (setup) => {
    it('should return full step output', async () => {
        const ctx = await setup()
        const mockRun = await createRunWithSteps(ctx)

        const response = await ctx.get(`/v1/flow-runs/${mockRun.id}/steps/step_1`)

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.input).toEqual({ code: 'console.log("hello")' })
        expect(body.output).toEqual({ result: 'hello' })
        expect(body.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(body.duration).toBe(200)
    })

    it('should return step inside loop with path', async () => {
        const ctx = await setup()
        const mockRun = await createRunWithSteps(ctx)

        const response = await ctx.get(
            `/v1/flow-runs/${mockRun.id}/steps/inner_step`,
            { path: 'loop_1:0' },
        )

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.input).toEqual({ val: 1 })
        expect(body.output).toEqual({ result: 'iteration-0' })
        expect(body.status).toBe(StepOutputStatus.SUCCEEDED)
    })

    it('should return step from second loop iteration', async () => {
        const ctx = await setup()
        const mockRun = await createRunWithSteps(ctx)

        const response = await ctx.get(
            `/v1/flow-runs/${mockRun.id}/steps/inner_step`,
            { path: 'loop_1:1' },
        )

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.output).toEqual({ result: 'iteration-1' })
    })

    it('should return 404 for nonexistent step', async () => {
        const ctx = await setup()
        const mockRun = await createRunWithSteps(ctx)

        const response = await ctx.get(`/v1/flow-runs/${mockRun.id}/steps/nonexistent_step`)

        expect(response?.statusCode).toBe(404)
    })

    it('should return 404 for nonexistent run', async () => {
        const ctx = await setup()

        const response = await ctx.get(`/v1/flow-runs/${apId()}/steps/step_1`)

        expect(response?.statusCode).toBe(404)
    })

    it('should return 404 for cross-project access', async () => {
        const ctx = await setup()
        const otherCtx = await setup()
        const mockRun = await createRunWithSteps(otherCtx)

        const response = await ctx.get(`/v1/flow-runs/${mockRun.id}/steps/step_1`)

        expect(response?.statusCode).toBe(404)
    })
})
