import { FlowRetryStrategy, FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../../helpers/mocks'
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

describe('Bulk retry flow runs (POST /v1/flow-runs/retry)', () => {
    it('scopes retry to the createdAfter window when Select All is used', async () => {
        const projectId = ctx.project.id
        const tenDaysAgo = new Date(Date.now() - 10 * DAY_MS).toISOString()
        const threeDaysAgo = new Date(Date.now() - 3 * DAY_MS).toISOString()
        const now = new Date().toISOString()

        const { run: oldRun } = await createFailedRun({ projectId, createdAt: tenDaysAgo })
        const { run: midRun } = await createFailedRun({ projectId, createdAt: threeDaysAgo })
        const { run: newRun } = await createFailedRun({ projectId, createdAt: now })

        const cutoff = new Date(Date.now() - 5 * DAY_MS).toISOString()
        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId,
            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
            createdAfter: cutoff,
        })

        expect(response.statusCode).toBe(200)

        const totalRuns = await countRunsForProject(projectId)
        expect(totalRuns).toBe(5)

        const oldStatus = await readStatus(oldRun.id)
        expect(oldStatus).toBe(FlowRunStatus.FAILED)

        const midStatus = await readStatus(midRun.id)
        expect(midStatus).toBe(FlowRunStatus.FAILED)
        const newStatus = await readStatus(newRun.id)
        expect(newStatus).toBe(FlowRunStatus.FAILED)
    })

    it('retries every matching run when createdAfter is omitted', async () => {
        const projectId = ctx.project.id
        await createFailedRun({ projectId, createdAt: new Date(Date.now() - 10 * DAY_MS).toISOString() })
        await createFailedRun({ projectId, createdAt: new Date(Date.now() - 3 * DAY_MS).toISOString() })
        await createFailedRun({ projectId, createdAt: new Date().toISOString() })

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId,
            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
        })

        expect(response.statusCode).toBe(200)
        const totalRuns = await countRunsForProject(projectId)
        expect(totalRuns).toBe(6)
    })

    it('scopes retry to the status filter', async () => {
        const projectId = ctx.project.id
        const { run: failed } = await createFailedRun({ projectId })
        const { run: succeeded } = await createFailedRun({
            projectId,
            status: FlowRunStatus.SUCCEEDED,
        })

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId,
            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
            status: [FlowRunStatus.FAILED],
        })

        expect(response.statusCode).toBe(200)
        const totalRuns = await countRunsForProject(projectId)
        expect(totalRuns).toBe(3)
        expect(await readStatus(failed.id)).toBe(FlowRunStatus.FAILED)
        expect(await readStatus(succeeded.id)).toBe(FlowRunStatus.SUCCEEDED)
    })

    it('scopes retry to the flowId filter', async () => {
        const projectId = ctx.project.id
        const { run: runA, flow: flowA } = await createFailedRun({ projectId })
        const { run: runB } = await createFailedRun({ projectId })

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId,
            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
            flowId: [flowA.id],
        })

        expect(response.statusCode).toBe(200)
        const runsForFlowA = await countRunsForFlow(flowA.id)
        expect(runsForFlowA).toBe(2)
        expect(await readStatus(runA.id)).toBe(FlowRunStatus.FAILED)
        expect(await readStatus(runB.id)).toBe(FlowRunStatus.FAILED)
    })

    it('skips runs listed in excludeFlowRunIds', async () => {
        const projectId = ctx.project.id
        const { run: run1 } = await createFailedRun({ projectId })
        const { run: run2 } = await createFailedRun({ projectId })
        const { run: run3 } = await createFailedRun({ projectId })

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId,
            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
            excludeFlowRunIds: [run2.id],
        })

        expect(response.statusCode).toBe(200)
        const totalRuns = await countRunsForProject(projectId)
        expect(totalRuns).toBe(5)
        expect(await readStatus(run1.id)).toBe(FlowRunStatus.FAILED)
        expect(await readStatus(run2.id)).toBe(FlowRunStatus.FAILED)
        expect(await readStatus(run3.id)).toBe(FlowRunStatus.FAILED)
    })

    it('never touches runs in other projects', async () => {
        const projectId = ctx.project.id
        await createFailedRun({ projectId })

        const { mockProject: otherProject } = await mockAndSaveBasicSetup()
        const { run: otherRun } = await createFailedRun({ projectId: otherProject.id })

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId,
            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
        })

        expect(response.statusCode).toBe(200)
        expect(await countRunsForProject(otherProject.id)).toBe(1)
        expect(await readStatus(otherRun.id)).toBe(FlowRunStatus.FAILED)
    })
})

const DAY_MS = 24 * 60 * 60 * 1000

async function createFailedRun({
    projectId,
    createdAt,
    status = FlowRunStatus.FAILED,
}: {
    projectId: string
    createdAt?: string
    status?: FlowRunStatus
}): Promise<{ flow: { id: string }, flowVersion: { id: string }, run: { id: string } }> {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.LOCKED,
    })
    await db.save('flow_version', flowVersion)

    const run = createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', run)

    if (createdAt) {
        await databaseConnection().query(
            'UPDATE flow_run SET created = $1 WHERE id = $2',
            [createdAt, run.id],
        )
    }

    return { flow, flowVersion, run }
}

async function countRunsForProject(projectId: string): Promise<number> {
    return databaseConnection().getRepository('flow_run').count({ where: { projectId } })
}

async function countRunsForFlow(flowId: string): Promise<number> {
    return databaseConnection().getRepository('flow_run').count({ where: { flowId } })
}

async function readStatus(runId: string): Promise<FlowRunStatus> {
    const row = await db.findOneByOrFail<{ status: FlowRunStatus }>('flow_run', { id: runId })
    return row.status
}
