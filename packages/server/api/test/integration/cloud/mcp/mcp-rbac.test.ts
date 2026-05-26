import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import {
    apId,
    DefaultProjectRole,
    McpServerType,
    Permission,
    ProjectScopedMcpServer,
} from '@activepieces/shared'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { apCreateFlowTool } from '../../../../src/app/mcp/tools/ap-create-flow'
import { apListFlowsTool } from '../../../../src/app/mcp/tools/ap-list-flows'
import { apSetupGuideTool } from '../../../../src/app/mcp/tools/ap-setup-guide'
import { resolvePermissionChecker } from '../../../../src/app/mcp/mcp-permissions'

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

            const checker = await resolvePermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const tool = apCreateFlowTool(mcp, mockLog)
            const execute = checker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
            const result = await execute({ flowName: 'Editor Flow' })

            expect(text(result)).toContain('✅')
            expect(text(result)).toContain('Editor Flow')
        })

        it('VIEWER cannot execute write tools (ap_create_flow)', async () => {
            const ctx = await createTestContext(app)
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const checker = await resolvePermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
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

            const checker = await resolvePermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const tool = apListFlowsTool(mcp, mockLog)
            const execute = checker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
            const result = await execute({})

            expect(text(result)).toContain('✅')
        })

        it('VIEWER cannot execute UPDATE_FLOW_STATUS tools', async () => {
            const ctx = await createTestContext(app)
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const checker = await resolvePermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const error = checker.check(Permission.UPDATE_FLOW_STATUS, 'ap_lock_and_publish')

            expect(error).not.toBeNull()
            expect(error!.isError).toBe(true)
            expect(text(error!)).toContain('Permission denied')
        })

        it('any role can execute tools with no permission requirement', async () => {
            const ctx = await createTestContext(app)
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })
            const mcp = makeMcp(ctx.project.id)

            const checker = await resolvePermissionChecker({ userId: memberCtx.user.id, projectId: ctx.project.id, log: mockLog })
            const tool = apSetupGuideTool(mcp, mockLog)

            const error = checker.check(tool.permission, tool.title)
            expect(error).toBeNull()

            const execute = checker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
            expect(execute).toBe(tool.execute)
        })
    })

})
