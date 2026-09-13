import { apId, Permission, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, McpServerType, PlatformRole, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { resolveMcpPermissionChecker, resolvePermissionChecker } from '../../../../src/app/mcp/mcp-permissions'
import { apCreateFlowTool } from '../../../../src/app/mcp/tools/ap-create-flow'
import { apListFlowsTool } from '../../../../src/app/mcp/tools/ap-list-flows'
import { apSetupGuideTool } from '../../../../src/app/mcp/tools/ap-setup-guide'
import { db } from '../../../helpers/db'
import { createMockProjectRole, mockBasicUser } from '../../../helpers/mocks'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

function makeMcp(projectId: string): ProjectScopedMcpServer {
    return {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId,
        platformId: null,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
    }
}

function text(result: { content: Array<{ type: 'text', text: string }> }): string {
    return result.content.map(c => c.text).join('\n')
}

describe('MCP Tool RBAC', () => {
    describe('with userId (OAuth path)', () => {
        it('EDITOR can execute write tools (ap_create_flow)', async () => {
            const ctx = await createTestContext(app)
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
            const mcp = makeMcp(ctx.project.id)

            const checker = await resolveMcpPermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const tool = apCreateFlowTool({ mcp, userId: memberCtx.user.id }, mockLog)
            const execute = checker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
            const result = await execute({ flowName: 'Editor Flow' })

            expect(text(result)).toContain('✅')
            expect(text(result)).toContain('Editor Flow')
        })

        it('VIEWER cannot execute write tools (ap_create_flow)', async () => {
            const ctx = await createTestContext(app)
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const checker = await resolveMcpPermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const error = checker.check(Permission.WRITE_FLOW, 'ap_create_flow')

            expect(error).not.toBeNull()
            expect(error!.isError).toBe(true)
            expect(text(error!)).toContain('Permission denied')
            expect(text(error!)).toContain(Permission.WRITE_FLOW)
        })

        it('VIEWER can execute read tools (ap_list_flows)', async () => {
            const ctx = await createTestContext(app)
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })
            const mcp = makeMcp(ctx.project.id)

            const checker = await resolveMcpPermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const tool = apListFlowsTool(mcp, mockLog)
            const execute = checker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
            const result = await execute({})

            expect(text(result)).toContain('✅')
        })

        it('VIEWER cannot execute UPDATE_FLOW_STATUS tools', async () => {
            const ctx = await createTestContext(app)
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const checker = await resolveMcpPermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const error = checker.check(Permission.UPDATE_FLOW_STATUS, 'ap_lock_and_publish')

            expect(error).not.toBeNull()
            expect(error!.isError).toBe(true)
            expect(text(error!)).toContain('Permission denied')
        })

        it('any role can execute tools with no permission requirement', async () => {
            const ctx = await createTestContext(app)
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })
            const mcp = makeMcp(ctx.project.id)

            const checker = await resolveMcpPermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const tool = apSetupGuideTool(mcp, mockLog)

            const error = checker.check(tool.permission, tool.title)
            expect(error).toBeNull()

            const execute = checker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
            expect(execute).toBe(tool.execute)
        })
    })

    describe('READ_MCP is enforced on every tool call', () => {
        async function createMemberWithPermissions(permissions: Permission[]) {
            const ctx = await createTestContext(app)
            const role = createMockProjectRole({
                platformId: ctx.platform.id,
                name: `custom-${apId()}`,
                permissions,
                type: RoleType.CUSTOM,
            })
            await db.save('project_role', role)
            const member = await createMemberContext(app, ctx, { projectRole: role.name })
            return { ctx, member }
        }

        it('denies a project tool when the role lacks READ_MCP, even though it grants that tool\'s permission', async () => {
            const { ctx, member } = await createMemberWithPermissions([Permission.READ_FLOW])

            const checker = await resolveMcpPermissionChecker({ userId: member.user.id, projectId: ctx.project.id, log: mockLog })
            const error = checker.check(Permission.READ_FLOW, 'ap_list_flows')

            expect(error).not.toBeNull()
            expect(error!.isError).toBe(true)
            expect(text(error!)).toContain(Permission.READ_MCP)
        })

        it('allows a project tool once the role grants READ_MCP', async () => {
            const { ctx, member } = await createMemberWithPermissions([Permission.READ_FLOW, Permission.READ_MCP])

            const checker = await resolveMcpPermissionChecker({ userId: member.user.id, projectId: ctx.project.id, log: mockLog })

            expect(checker.check(Permission.READ_FLOW, 'ap_list_flows')).toBeNull()
        })

        it('still allows piece-catalog tools when the role lacks READ_MCP', async () => {
            const { ctx, member } = await createMemberWithPermissions([Permission.READ_FLOW])

            const checker = await resolveMcpPermissionChecker({ userId: member.user.id, projectId: ctx.project.id, log: mockLog })

            expect(checker.check(undefined, 'ap_research_pieces')).toBeNull()
            expect(checker.check(undefined, 'ap_get_piece_props')).toBeNull()
        })

        it('leaves the non-MCP checker alone, so agent permissions do not require READ_MCP', async () => {
            const { ctx, member } = await createMemberWithPermissions([Permission.READ_FLOW, Permission.WRITE_AGENT])

            const checker = await resolvePermissionChecker({ userId: member.user.id, projectId: ctx.project.id, log: mockLog })

            expect(checker.check(Permission.READ_FLOW, '__name_flows_using_agent')).toBeNull()
            expect(checker.check(Permission.WRITE_AGENT, '__move_agent_into_project')).toBeNull()
        })
    })

    describe('when the user has no role in the project', () => {
        async function createStrangerChecker() {
            const ctx = await createTestContext(app)
            const { mockUser: stranger } = await mockBasicUser({
                user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER },
            })
            const checker = await resolveMcpPermissionChecker({ userId: stranger.id, projectId: ctx.project.id, log: mockLog })
            return { ctx, checker }
        }

        it('denies project tools that declare no permission', async () => {
            const { ctx, checker } = await createStrangerChecker()
            const tool = apSetupGuideTool(makeMcp(ctx.project.id), mockLog)

            const error = checker.check(tool.permission, tool.title)
            expect(error).not.toBeNull()
            expect(text(error!)).toContain('no role')

            const execute = checker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
            expect(text(await execute({}))).toContain('Permission denied')
        })

        it('denies project tools that declare a permission', async () => {
            const { checker } = await createStrangerChecker()

            const error = checker.check(Permission.READ_FLOW, 'ap_list_flows')
            expect(error).not.toBeNull()
            expect(text(error!)).toContain('no role')
        })

        it('still allows piece-catalog tools, which read no project data', async () => {
            const { checker } = await createStrangerChecker()

            expect(checker.check(undefined, 'ap_research_pieces')).toBeNull()
            expect(checker.check(undefined, 'ap_list_ai_models')).toBeNull()
        })
    })

})
