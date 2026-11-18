import { apId } from '@activepieces/core-utils'
import { AnalyticsRunsUsageItem, DefaultProjectRole, FlowStatus, FlowVersionState, PlatformRole, ProjectType, RunEnvironment } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, createMockProject, mockBasicUser } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createEnabledFlowWithRun(projectId: string, displayName: string) {
    const flow = createMockFlow({ projectId, status: FlowStatus.ENABLED })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.DRAFT,
        displayName,
    })
    await db.save('flow_version', flowVersion)
    await db.save('flow_run', createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        environment: RunEnvironment.PRODUCTION,
        created: dayjs().subtract(1, 'hour').toISOString(),
    }))
    return flow
}

async function seedTwoProjects(ctx: TestContext) {
    const { mockUser: foreignUser } = await mockBasicUser({
        user: {
            platformId: ctx.platform.id,
            platformRole: PlatformRole.MEMBER,
        },
    })

    const foreignProject = createMockProject({
        platformId: ctx.platform.id,
        ownerId: foreignUser.id,
        type: ProjectType.TEAM,
    })
    await db.save('project', foreignProject)

    const ownFlow = await createEnabledFlowWithRun(ctx.project.id, 'own-project-flow')
    const foreignFlow = await createEnabledFlowWithRun(foreignProject.id, 'foreign-project-flow')

    return { foreignUser, foreignProject, ownFlow, foreignFlow }
}

async function refreshRunsOfFlow({ ctx, flowId }: { ctx: TestContext, flowId: string }) {
    const response = await ctx.post('/v1/analytics/refresh')
    expect(response?.statusCode).toBe(StatusCodes.OK)
    const runs: AnalyticsRunsUsageItem[] = response!.json().runs.filter((run: AnalyticsRunsUsageItem) => run.flowId === flowId)
    return { entries: runs.length, total: runs.reduce((sum, run) => sum + run.runs, 0) }
}

describe('Platform Analytics API', () => {
    describe('GET /v1/analytics', () => {
        it('should return the whole platform report to a platform admin', async () => {
            const ctx = await createTestContext(app!, {
                plan: { analyticsEnabled: true },
            })
            const { ownFlow, foreignFlow, foreignUser } = await seedTwoProjects(ctx)

            const response = await ctx.get('/v1/analytics')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const report = response!.json()
            const flowIds = report.flows.map((flow: { flowId: string }) => flow.flowId)
            expect(flowIds).toContain(ownFlow.id)
            expect(flowIds).toContain(foreignFlow.id)
            expect(report.users.map((user: { id: string }) => user.id)).toContain(foreignUser.id)
        })

        it('should scope flows to the projects the caller can access', async () => {
            const ctx = await createTestContext(app!, {
                plan: { analyticsEnabled: true },
            })
            const { ownFlow, foreignFlow } = await seedTwoProjects(ctx)
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.EDITOR,
            })

            const response = await memberCtx.get('/v1/analytics')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const report = response!.json()
            const flowIds = report.flows.map((flow: { flowId: string }) => flow.flowId)
            expect(flowIds).toContain(ownFlow.id)
            expect(flowIds).not.toContain(foreignFlow.id)
        })

        it('should not disclose runs of flows outside the caller projects', async () => {
            const ctx = await createTestContext(app!, {
                plan: { analyticsEnabled: true },
            })
            const { foreignFlow } = await seedTwoProjects(ctx)
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.EDITOR,
            })

            const response = await memberCtx.get('/v1/analytics')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const report = response!.json()
            const runFlowIds = report.runs.map((run: { flowId: string }) => run.flowId)
            expect(runFlowIds).not.toContain(foreignFlow.id)
        })

        it('should not disclose users outside the caller projects', async () => {
            const ctx = await createTestContext(app!, {
                plan: { analyticsEnabled: true },
            })
            const { foreignUser } = await seedTwoProjects(ctx)
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.EDITOR,
            })

            const response = await memberCtx.get('/v1/analytics')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const report = response!.json()
            const userIds = report.users.map((user: { id: string }) => user.id)
            expect(userIds).not.toContain(foreignUser.id)
            expect(userIds).toContain(memberCtx.user.id)
        })

        it('should keep the report reachable for a viewer', async () => {
            const ctx = await createTestContext(app!, {
                plan: { analyticsEnabled: true },
            })
            await seedTwoProjects(ctx)
            const viewerCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await viewerCtx.get('/v1/analytics')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response!.json().users.map((user: { id: string }) => user.id)).toContain(viewerCtx.user.id)
        })
    })
})

describe('Platform Analytics API — disabled flows', () => {
    it('should keep runs of a disabled flow in an accessible project', async () => {
        const ctx = await createTestContext(app!, {
            plan: { analyticsEnabled: true },
        })
        await createEnabledFlowWithRun(ctx.project.id, 'own-enabled-flow')
        const disabledFlow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
        await db.save('flow', disabledFlow)
        const disabledVersion = createMockFlowVersion({
            flowId: disabledFlow.id,
            state: FlowVersionState.DRAFT,
            displayName: 'own-disabled-flow',
        })
        await db.save('flow_version', disabledVersion)
        await db.save('flow_run', createMockFlowRun({
            projectId: ctx.project.id,
            flowId: disabledFlow.id,
            flowVersionId: disabledVersion.id,
            environment: RunEnvironment.PRODUCTION,
            created: dayjs().subtract(1, 'hour').toISOString(),
        }))
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })

        const adminResponse = await ctx.get('/v1/analytics')
        const memberResponse = await memberCtx.get('/v1/analytics')

        const adminRunFlowIds = adminResponse!.json().runs.map((run: { flowId: string }) => run.flowId)
        const memberRunFlowIds = memberResponse!.json().runs.map((run: { flowId: string }) => run.flowId)
        expect(adminRunFlowIds).toContain(disabledFlow.id)
        expect(memberRunFlowIds).toContain(disabledFlow.id)
    })
})

describe('POST /v1/analytics/refresh', () => {
    it('should not disclose other projects to a non-admin member', async () => {
        const ctx = await createTestContext(app!, {
            plan: { analyticsEnabled: true },
        })
        const { foreignFlow, foreignUser, ownFlow } = await seedTwoProjects(ctx)
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })

        const response = await memberCtx.post('/v1/analytics/refresh')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const report = response!.json()
        const flowIds = report.flows.map((flow: { flowId: string }) => flow.flowId)
        expect(flowIds).toContain(ownFlow.id)
        expect(flowIds).not.toContain(foreignFlow.id)
        expect(report.users.map((user: { id: string }) => user.id)).not.toContain(foreignUser.id)
    })

    it('should return the whole platform report to a platform admin', async () => {
        const ctx = await createTestContext(app!, {
            plan: { analyticsEnabled: true },
        })
        const { foreignFlow } = await seedTwoProjects(ctx)

        const response = await ctx.post('/v1/analytics/refresh')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const flowIds = response!.json().flows.map((flow: { flowId: string }) => flow.flowId)
        expect(flowIds).toContain(foreignFlow.id)
    })

    it('should keep one entry per flow and day with the right total across repeated refreshes', async () => {
        const ctx = await createTestContext(app!, {
            plan: { analyticsEnabled: true },
        })
        const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.ENABLED })
        await db.save('flow', flow)
        const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.DRAFT })
        await db.save('flow_version', flowVersion)
        const start = dayjs().subtract(1, 'day').startOf('hour')
        const addRuns = ({ count, created }: { count: number, created: dayjs.Dayjs }) => db.save('flow_run', Array.from({ length: count }, () => createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            created: created.toISOString(),
        })))
        await addRuns({ count: 3, created: start })

        const first = await refreshRunsOfFlow({ ctx, flowId: flow.id })
        const report = await db.findOneByOrFail<{ id: string }>('platform_analytics_report', { platformId: ctx.platform.id })
        await db.update('platform_analytics_report', report.id, { cachedAt: start.add(1, 'minute').toISOString() })
        await addRuns({ count: 1, created: start.add(2, 'minute') })
        const second = await refreshRunsOfFlow({ ctx, flowId: flow.id })
        const third = await refreshRunsOfFlow({ ctx, flowId: flow.id })

        expect({ first, second, third }).toEqual({
            first: { entries: 1, total: 3 },
            second: { entries: 1, total: 4 },
            third: { entries: 1, total: 4 },
        })
    })

    it('should merge same-day entries already split in a saved report', async () => {
        const ctx = await createTestContext(app!, {
            plan: { analyticsEnabled: true },
        })
        const flowId = apId()
        const otherFlowId = apId()
        const day = dayjs().startOf('day').toISOString()
        const previousDay = dayjs().startOf('day').subtract(1, 'day').toISOString()
        await db.save('platform_analytics_report', {
            id: apId(),
            platformId: ctx.platform.id,
            cachedAt: dayjs().toISOString(),
            outdated: false,
            runs: [
                { flowId, day, runs: 3 },
                { flowId, day, runs: 1 },
                { flowId, day: previousDay, runs: 2 },
                { flowId: otherFlowId, day, runs: 5 },
            ],
            flows: [],
            users: [],
        })

        const response = await ctx.post('/v1/analytics/refresh')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const runs = response!.json().runs
        expect(runs).toHaveLength(3)
        expect(runs).toEqual(expect.arrayContaining([
            { flowId, day, runs: 4 },
            { flowId, day: previousDay, runs: 2 },
            { flowId: otherFlowId, day, runs: 5 },
        ]))
    })

    it('should count a run whose row is written after the refresh that covered its time', async () => {
        const ctx = await createTestContext(app!, {
            plan: { analyticsEnabled: true },
        })
        const flow = await createEnabledFlowWithRun(ctx.project.id, 'late-run-flow')
        const first = await refreshRunsOfFlow({ ctx, flowId: flow.id })
        const report = await db.findOneByOrFail<{ cachedAt: string }>('platform_analytics_report', { platformId: ctx.platform.id })
        const flowVersion = await db.findOneByOrFail<{ id: string }>('flow_version', { flowId: flow.id })
        await db.save('flow_run', createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            created: dayjs(report.cachedAt).subtract(1, 'second').toISOString(),
        }))

        const second = await refreshRunsOfFlow({ ctx, flowId: flow.id })

        expect({ first: first.total, second: second.total }).toEqual({ first: 1, second: 2 })
    })

    it('should count runs of a project that has no enabled flow', async () => {
        const ctx = await createTestContext(app!, {
            plan: { analyticsEnabled: true },
        })
        const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
        await db.save('flow', flow)
        const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.DRAFT })
        await db.save('flow_version', flowVersion)
        await db.save('flow_run', createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            environment: RunEnvironment.PRODUCTION,
            created: dayjs().subtract(1, 'hour').toISOString(),
        }))

        const runs = await refreshRunsOfFlow({ ctx, flowId: flow.id })

        expect(runs).toEqual({ entries: 1, total: 1 })
    })
})
