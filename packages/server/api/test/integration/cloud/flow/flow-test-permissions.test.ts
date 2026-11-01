import { apId, DefaultProjectRole, FlowVersionState, ProjectReleaseType, TriggerTestStrategy } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion } from '../../../helpers/mocks'
import { describeRolePermissions } from '../../../helpers/permission-test'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('POST /v1/sample-data/test-step', () => {
    describeRolePermissions({
        app: () => app!,
        request: async (memberCtx, ownerCtx) => {
            const { flowVersionId } = await saveFlow(ownerCtx)
            return memberCtx.post('/v1/sample-data/test-step', {
                projectId: ownerCtx.project.id,
                flowVersionId,
                stepName: 'trigger',
            })
        },
        allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
        forbiddenRoles: [DefaultProjectRole.VIEWER],
    })

    it('a Viewer starts no test run', async () => {
        const owner = await createTestContext(app!)
        const viewer = await createMemberContext(app!, owner, { projectRole: DefaultProjectRole.VIEWER })
        const { flowVersionId } = await saveFlow(owner)

        await viewer.post('/v1/sample-data/test-step', { projectId: owner.project.id, flowVersionId, stepName: 'trigger' })

        const runs = await db.findBy('flow_run', { projectId: owner.project.id })
        expect(runs).toHaveLength(0)
    })
})

describe('POST /v1/test-trigger', () => {
    describeRolePermissions({
        app: () => app!,
        request: async (memberCtx, ownerCtx) => {
            const { flowId, flowVersionId } = await saveFlow(ownerCtx)
            return memberCtx.post('/v1/test-trigger', {
                projectId: ownerCtx.project.id,
                flowId,
                flowVersionId,
                testStrategy: TriggerTestStrategy.SIMULATION,
            })
        },
        allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
        forbiddenRoles: [DefaultProjectRole.VIEWER],
    })
})

describe('DELETE /v1/test-trigger', () => {
    describeRolePermissions({
        app: () => app!,
        request: async (memberCtx, ownerCtx) => {
            const { flowId } = await saveFlow(ownerCtx)
            return memberCtx.inject({
                method: 'DELETE',
                url: '/api/v1/test-trigger',
                body: { projectId: ownerCtx.project.id, flowId },
            })
        },
        allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
        forbiddenRoles: [DefaultProjectRole.VIEWER],
    })
})

describe('POST /v1/trigger-events', () => {
    describeRolePermissions({
        app: () => app!,
        request: async (memberCtx, ownerCtx) => {
            const { flowId } = await saveFlow(ownerCtx)
            return memberCtx.post('/v1/trigger-events', {
                projectId: ownerCtx.project.id,
                flowId,
                mockData: { hello: 'world' },
            })
        },
        allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
        forbiddenRoles: [DefaultProjectRole.VIEWER],
    })
})

describe('POST /v1/project-releases', () => {
    describeRolePermissions({
        app: () => app!,
        request: async (memberCtx, ownerCtx) => memberCtx.post('/v1/project-releases', {
            name: 'release',
            description: 'release',
            selectedFlowsIds: null,
            projectId: ownerCtx.project.id,
            type: ProjectReleaseType.PROJECT,
            targetProjectId: apId(),
        }),
        allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
        forbiddenRoles: [DefaultProjectRole.VIEWER],
    })
})

describe('POST /v1/project-releases/diff', () => {
    describeRolePermissions({
        app: () => app!,
        request: async (memberCtx, ownerCtx) => memberCtx.post('/v1/project-releases/diff', {
            projectId: ownerCtx.project.id,
            type: ProjectReleaseType.PROJECT,
            targetProjectId: apId(),
        }),
        allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
        forbiddenRoles: [DefaultProjectRole.VIEWER],
    })
})

async function saveFlow(ctx: TestContext): Promise<{ flowId: string, flowVersionId: string }> {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.DRAFT, updatedBy: ctx.user.id })
    await db.save('flow_version', flowVersion)
    return { flowId: flow.id, flowVersionId: flowVersion.id }
}
