import { DefaultProjectRole, FlowStatus, FlowVersionState, PlatformRole, ProjectType, RunEnvironment } from '@activepieces/shared'
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
})
