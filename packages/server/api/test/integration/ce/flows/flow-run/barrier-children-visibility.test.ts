import { apId } from '@activepieces/core-utils'
import { FlowRetryStrategy, FlowRunStatus, FlowStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { platformAnalyticsReportService } from '../../../../../src/app/analytics/platform-analytics-report.service'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { healthMetricsService } from '../../../../../src/app/health/health-metrics.service'
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

async function seedFanOut({ childStatuses, parentStatus = FlowRunStatus.PAUSED, created }: {
    childStatuses: FlowRunStatus[]
    parentStatus?: FlowRunStatus
    created?: string
}) {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.ENABLED })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    await db.save('flow_version', createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.DRAFT }))
    await db.update('flow', flow.id, { publishedVersionId: flowVersion.id })

    const barrierId = apId()
    const parent = createMockFlowRun({
        projectId: ctx.project.id,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: parentStatus,
        environment: RunEnvironment.PRODUCTION,
        ...(created ? { created } : {}),
    })
    await db.save('flow_run', parent)

    const children = childStatuses.map((status, index) => ({
        ...createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status,
            parentRunId: parent.id,
            parentWaitpointId: barrierId,
            environment: RunEnvironment.PRODUCTION,
            ...(created ? { created } : {}),
        }),
        dispatchIndex: index,
    }))
    for (const child of children) {
        await db.save('flow_run', child)
    }

    return { flow, flowVersion, parent, children, barrierId }
}

describe('Barrier children on user-facing surfaces', () => {
    it('lists the parent but none of its children', async () => {
        const { parent } = await seedFanOut({
            childStatuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED],
        })

        const response = await ctx.get('/v1/flow-runs', { projectId: ctx.project.id, limit: 100 })

        expect(response.statusCode).toBe(200)
        expect(response.json().data.map((run: { id: string }) => run.id)).toEqual([parent.id])
    })

    it('counts by status agree exactly with the rows the list returns', async () => {
        await seedFanOut({
            childStatuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED],
            parentStatus: FlowRunStatus.SUCCEEDED,
        })

        const list = await ctx.get('/v1/flow-runs', { projectId: ctx.project.id, limit: 100 })
        const counts = await ctx.get('/v1/flow-runs/count-by-status', { projectId: ctx.project.id })

        expect(counts.statusCode).toBe(200)
        const totalCounted = counts.json().data.reduce((sum: number, row: { count: number }) => sum + row.count, 0)
        expect(totalCounted).toBe(list.json().data.length)
        expect(counts.json().data).toEqual([{ status: FlowRunStatus.SUCCEEDED, count: 1 }])
    })

    it('cannot select a child through a filter-driven bulk retry', async () => {
        await seedFanOut({
            childStatuses: [FlowRunStatus.FAILED, FlowRunStatus.FAILED],
            parentStatus: FlowRunStatus.FAILED,
        })

        const response = await ctx.post('/v1/flow-runs/retry', {
            projectId: ctx.project.id,
            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
            status: [FlowRunStatus.FAILED],
        })

        expect(response.statusCode).toBe(200)
        await waitForRunCountForProject({ projectId: ctx.project.id, expected: 4 })
    })

    it('excludes children from the analytics report', async () => {
        const { flow } = await seedFanOut({
            childStatuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED],
            parentStatus: FlowRunStatus.SUCCEEDED,
        })

        const report = await platformAnalyticsReportService(app.log).refreshReport(ctx.platform.id)

        const runsForFlow = report.runs.filter((run) => run.flowId === flow.id)
        expect(runsForFlow.reduce((sum, run) => sum + run.runs, 0)).toBe(1)
    })
})

describe('Barrier children on ops surfaces', () => {
    it('keeps counting children in the platform health metrics', async () => {
        await seedFanOut({
            childStatuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED],
            parentStatus: FlowRunStatus.SUCCEEDED,
        })

        const report = await healthMetricsService(app.log).getRunMetrics(ctx.platform.id, {
            createdAfter: dayjs().subtract(1, 'day').toISOString(),
            createdBefore: dayjs().add(1, 'day').toISOString(),
        })

        expect(report.summary.completed).toBe(4)
    })
})

describe('Reaching a barrier child on request', () => {
    it('returns a child by id under the ordinary project read permission', async () => {
        const { children } = await seedFanOut({ childStatuses: [FlowRunStatus.SUCCEEDED] })

        const response = await ctx.get(`/v1/flow-runs/${children[0].id}`)

        expect(response.statusCode).toBe(200)
        expect(response.json().id).toBe(children[0].id)
        expect(response.json().steps).toEqual({})
    })

    it('returns a barrier\'s children in dispatch order when asked for them explicitly', async () => {
        const { children, barrierId } = await seedFanOut({
            childStatuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED, FlowRunStatus.SUCCEEDED],
        })

        const response = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
            parentWaitpointId: barrierId,
            limit: 100,
        })

        expect(response.statusCode).toBe(200)
        expect(response.json().data.map((run: { id: string }) => run.id)).toEqual(children.map((child) => child.id))
    })

    it('pages through a barrier\'s children in dispatch order', async () => {
        const { children, barrierId } = await seedFanOut({
            childStatuses: Array.from({ length: 5 }, () => FlowRunStatus.SUCCEEDED),
        })

        const firstPage = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
            parentWaitpointId: barrierId,
            limit: 2,
        })
        const secondPage = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
            parentWaitpointId: barrierId,
            limit: 2,
            cursor: firstPage.json().next,
        })

        expect(firstPage.json().data.map((run: { id: string }) => run.id)).toEqual(children.slice(0, 2).map((child) => child.id))
        expect(secondPage.json().data.map((run: { id: string }) => run.id)).toEqual(children.slice(2, 4).map((child) => child.id))
    })

    it('leaves a child with no dispatch index out of the dispatch-ordered listing rather than stalling the cursor', async () => {
        const { children, barrierId } = await seedFanOut({
            childStatuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED],
        })
        await databaseConnection().query('UPDATE flow_run SET "dispatchIndex" = NULL WHERE id = ANY($1)', [children.map((child) => child.id)])

        const firstPage = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
            parentWaitpointId: barrierId,
            limit: 1,
        })
        const secondPage = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
            parentWaitpointId: barrierId,
            limit: 1,
            cursor: firstPage.json().next,
        })

        expect(firstPage.json().data).toEqual([])
        expect(secondPage.json().data).toEqual([])
    })

    it('never returns another barrier\'s children', async () => {
        const { barrierId } = await seedFanOut({ childStatuses: [FlowRunStatus.SUCCEEDED] })
        await seedFanOut({ childStatuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED] })

        const response = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
            parentWaitpointId: barrierId,
            limit: 100,
        })

        expect(response.json().data).toHaveLength(1)
    })
})

async function waitForRunCountForProject({ projectId, expected }: { projectId: string, expected: number }): Promise<void> {
    const read = async () => databaseConnection().getRepository('flow_run').count({ where: { projectId } })
    const start = Date.now()
    let last = await read()
    while (last !== expected && Date.now() - start < 10_000) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        last = await read()
    }
    expect(last).toBe(expected)
}
