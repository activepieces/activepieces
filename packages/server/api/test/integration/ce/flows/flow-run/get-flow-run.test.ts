import { FastifyInstance } from 'fastify'
import { FileCompression, FileLocation, FileType, FlowActionType, FlowRunStatus, RunEnvironment, StepOutputStatus } from '@activepieces/shared'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { describeWithAuth } from '../../../../helpers/describe-with-auth'
import { createMockFile, createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { db } from '../../../../helpers/db'

// Must match AP_FLOW_RUN_LOG_LAZY_LOAD_THRESHOLD_MB in .env.tests (1 MB)
const TEST_THRESHOLD_BYTES = 1 * 1024 * 1024

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

function createLargeLogFile(projectId: string, platformId: string, steps: Record<string, unknown>) {
    const baseJson = JSON.stringify({ executionState: { steps, tags: [] } })
    const paddingSize = TEST_THRESHOLD_BYTES + 512 - baseJson.length
    const padding = 'x'.repeat(Math.max(0, paddingSize))
    const padded = baseJson.slice(0, -1) + ',"_p":"' + padding + '"}'
    const data = Buffer.from(padded)
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

async function createFlowAndVersion(projectId: string) {
    const mockFlow = createMockFlow({ projectId })
    await db.save('flow', mockFlow)
    const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', mockFlowVersion)
    return { mockFlow, mockFlowVersion }
}

describeWithAuth('Get flow run endpoint', () => app!, (setup) => {
    it('should return full steps for small run', async () => {
        const ctx = await setup()

        const steps = {
            trigger: {
                type: 'EMPTY',
                status: StepOutputStatus.SUCCEEDED,
                input: { key: 'in' },
                output: { key: 'out' },
                duration: 100,
            },
            step_1: {
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: { code: 'x' },
                output: { result: 'y' },
                duration: 200,
            },
        }

        const logFile = createLogFile(ctx.project.id, ctx.platform.id, steps)
        await db.save('file', logFile)

        const { mockFlow, mockFlowVersion } = await createFlowAndVersion(ctx.project.id)

        const mockRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: mockFlow.id,
            flowVersionId: mockFlowVersion.id,
            logsFileId: logFile.id,
            status: FlowRunStatus.SUCCEEDED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', mockRun)

        const response = await ctx.get(`/v1/flow-runs/${mockRun.id}`, {
            truncateStepsIfSizeExceedsThreshold: 'true',
        })

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.steps.step_1.input).toEqual({ code: 'x' })
        expect(body.steps.step_1.output).toEqual({ result: 'y' })
        expect(body.stepsDataTruncated).toBeUndefined()
    })

    it('should return truncated steps for large run', async () => {
        const ctx = await setup()

        const steps = {
            trigger: {
                type: 'EMPTY',
                status: StepOutputStatus.SUCCEEDED,
                input: { key: 'in' },
                output: { key: 'out' },
                duration: 50,
            },
            step_1: {
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: { code: 'big' },
                output: { result: 'big' },
                duration: 300,
            },
        }

        const logFile = createLargeLogFile(ctx.project.id, ctx.platform.id, steps)
        await db.save('file', logFile)

        const { mockFlow, mockFlowVersion } = await createFlowAndVersion(ctx.project.id)

        const mockRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: mockFlow.id,
            flowVersionId: mockFlowVersion.id,
            logsFileId: logFile.id,
            status: FlowRunStatus.SUCCEEDED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', mockRun)

        const response = await ctx.get(`/v1/flow-runs/${mockRun.id}`, {
            truncateStepsIfSizeExceedsThreshold: 'true',
        })

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.stepsDataTruncated).toBe(true)
        expect(body.steps.step_1.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(body.steps.step_1.type).toBe(FlowActionType.CODE)
        expect(body.steps.step_1.duration).toBe(300)
        expect(body.steps.step_1.input).toBeUndefined()
        expect(body.steps.step_1.output).toBeUndefined()
    })

    it('should return full steps for large run without truncate flag', async () => {
        const ctx = await setup()

        const steps = {
            step_1: {
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: { code: 'big' },
                output: { result: 'big' },
                duration: 300,
            },
        }

        const logFile = createLargeLogFile(ctx.project.id, ctx.platform.id, steps)
        await db.save('file', logFile)

        const { mockFlow, mockFlowVersion } = await createFlowAndVersion(ctx.project.id)

        const mockRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: mockFlow.id,
            flowVersionId: mockFlowVersion.id,
            logsFileId: logFile.id,
            status: FlowRunStatus.SUCCEEDED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', mockRun)

        const response = await ctx.get(`/v1/flow-runs/${mockRun.id}`)

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.stepsDataTruncated).toBeUndefined()
        expect(body.steps.step_1.input).toEqual({ code: 'big' })
        expect(body.steps.step_1.output).toEqual({ result: 'big' })
    })

    it('should preserve loop iteration structure for large truncated run', async () => {
        const ctx = await setup()

        const steps = {
            trigger: {
                type: 'EMPTY',
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: [1, 2],
                duration: 10,
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
                                output: { result: 'a' },
                                duration: 50,
                            },
                        },
                        {
                            inner_step: {
                                type: FlowActionType.CODE,
                                status: StepOutputStatus.SUCCEEDED,
                                input: { val: 2 },
                                output: { result: 'b' },
                                duration: 60,
                            },
                        },
                    ],
                },
                duration: 120,
            },
        }

        const logFile = createLargeLogFile(ctx.project.id, ctx.platform.id, steps)
        await db.save('file', logFile)

        const { mockFlow, mockFlowVersion } = await createFlowAndVersion(ctx.project.id)

        const mockRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: mockFlow.id,
            flowVersionId: mockFlowVersion.id,
            logsFileId: logFile.id,
            status: FlowRunStatus.SUCCEEDED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', mockRun)

        const response = await ctx.get(`/v1/flow-runs/${mockRun.id}`, {
            truncateStepsIfSizeExceedsThreshold: 'true',
        })

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.stepsDataTruncated).toBe(true)

        const loop = body.steps.loop_1
        expect(loop.type).toBe(FlowActionType.LOOP_ON_ITEMS)
        expect(loop.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(loop.input).toBeUndefined()
        expect(loop.output.iterations).toHaveLength(2)
        expect(loop.output.item).toBeUndefined()

        const innerStep = loop.output.iterations[0].inner_step
        expect(innerStep.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(innerStep.input).toBeUndefined()
        expect(innerStep.output).toBeUndefined()
    })

    it('should return empty steps when logsFileId is null', async () => {
        const ctx = await setup()

        const { mockFlow, mockFlowVersion } = await createFlowAndVersion(ctx.project.id)

        const mockRun = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: mockFlow.id,
            flowVersionId: mockFlowVersion.id,
            logsFileId: null,
            status: FlowRunStatus.SUCCEEDED,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', mockRun)

        const response = await ctx.get(`/v1/flow-runs/${mockRun.id}`)

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.steps).toEqual({})
        expect(body.stepsDataTruncated).toBeUndefined()
    })
})
