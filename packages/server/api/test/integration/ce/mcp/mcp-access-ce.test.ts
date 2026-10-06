import { apId, Permission, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, ProjectMember } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mcpAccess } from '../../../../src/app/mcp/mcp-access'
import { db } from '../../../helpers/db'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMockProjectRole } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const LOCKED_TOOL = 'ap_list_flows'
const PIECE_CATALOG_TOOL = 'ap_research_pieces'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createCustomRoleMember({ ctx, permissions }: { ctx: TestContext, permissions: Permission[] }): Promise<TestContext> {
    const role = createMockProjectRole({
        platformId: ctx.platform.id,
        name: `role-${apId()}`,
        permissions,
        type: RoleType.CUSTOM,
    })
    await db.save('project_role', role)
    return createMemberContext(app, ctx, { projectRole: role.name })
}

function connectAs({ ctx }: { ctx: TestContext }): Promise<McpClient> {
    return mcpClientHelpers.connect({
        app,
        approve: (payload) => ctx.post('/v1/mcp-oauth/approve', payload),
    })
}

function call({ mcpClient, name, args }: { mcpClient: McpClient, name: string, args?: Record<string, unknown> }): Promise<string> {
    return mcpClientHelpers.callTool({ app, mcpClient, name, args })
}

describe('MCP access on community edition', () => {
    it('keeps a project accessible although the role lacks READ_MCP, because community edition has no RBAC', async () => {
        const ctx = await createTestContext(app)
        const member = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW] })

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: member.user.id, log: app.log })

        expect(projects.map(p => p.id)).toEqual([ctx.project.id])
    })

    it('lets a member whose role lacks READ_MCP connect and run a read tool', async () => {
        const ctx = await createTestContext(app)
        const member = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW] })
        const mcpClient = await connectAs({ ctx: member })

        await call({ mcpClient, name: 'ap_set_project_context', args: { projectId: ctx.project.id } })
        const listed = await call({ mcpClient, name: LOCKED_TOOL })

        expect(listed).not.toContain('Permission denied')
    })

    it('lets a member whose role lacks READ_MCP run a piece-catalog tool', async () => {
        const ctx = await createTestContext(app)
        const member = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW] })
        const mcpClient = await connectAs({ ctx: member })

        const researched = await call({ mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })

        expect(researched).not.toContain('Permission denied')
    })

    it('refuses a piece-catalog tool on an issued token once the member leaves every project', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const mcpClient = await connectAs({ ctx: member })
        expect(await call({ mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })).not.toContain('Permission denied')

        const membership = await db.findOneByOrFail<ProjectMember>('project_member', { userId: member.user.id })
        await db.delete('project_member', membership.id)

        expect(await call({ mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })).toContain(Permission.READ_MCP)
    })

    it('refuses project selection on an issued token once the member leaves every project', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const mcpClient = await connectAs({ ctx: member })

        const membership = await db.findOneByOrFail<ProjectMember>('project_member', { userId: member.user.id })
        await db.delete('project_member', membership.id)

        expect(await call({ mcpClient, name: 'ap_set_project_context', args: { projectId: ctx.project.id } })).toContain(Permission.READ_MCP)
    })

    it('refuses platform-wide authorization to a member who belongs to no project', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const membership = await db.findOneByOrFail<ProjectMember>('project_member', { userId: member.user.id })
        await db.delete('project_member', membership.id)

        const response = await member.post('/v1/mcp-oauth/approve', { authRequestId: 'unused' })

        expect(response.statusCode).toBe(403)
    })
})
