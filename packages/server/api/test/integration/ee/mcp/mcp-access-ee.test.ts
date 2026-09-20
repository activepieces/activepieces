import { apId, Permission, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, McpServerType, PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mcpAccess } from '../../../../src/app/mcp/mcp-access'
import { resolveMcpPermissionChecker } from '../../../../src/app/mcp/mcp-permissions'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMockProject, createMockProjectRole, mockBasicUser } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const SWITCHED_OFF_TOOL = 'ap_create_flow'
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

async function connectAsOperator({ ctx }: { ctx: TestContext }): Promise<McpClient> {
    const { mockUser } = await mockBasicUser({
        user: {
            platformId: ctx.platform.id,
            platformRole: PlatformRole.OPERATOR,
        },
    })
    const token = await generateMockToken({
        id: mockUser.id,
        type: PrincipalType.USER,
        platform: { id: ctx.platform.id },
    })
    return mcpClientHelpers.connect({
        app,
        approve: (payload) => app.inject({
            method: 'POST',
            url: '/api/v1/mcp-oauth/approve',
            headers: { authorization: `Bearer ${token}` },
            payload,
        }),
    })
}

describe('MCP access on enterprise edition', () => {
    it('enforces READ_MCP on the checker, exactly as cloud does', async () => {
        const ctx = await createTestContext(app)
        const member = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW] })

        const checker = await resolveMcpPermissionChecker({ userId: member.user.id, projectId: ctx.project.id, log: app.log })

        expect(checker.check(Permission.READ_FLOW, LOCKED_TOOL)).not.toBeNull()
    })

    it('leaves a project out of the accessible list when its role lacks READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const member = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW] })

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: member.user.id, log: app.log })

        expect(projects).toHaveLength(0)
    })

    it('refuses platform-wide authorization to a member holding READ_MCP nowhere', async () => {
        const ctx = await createTestContext(app)
        const member = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW] })

        const response = await member.post('/v1/mcp-oauth/approve', { authRequestId: 'unused' })

        expect(response.statusCode).toBe(403)
    })

    it('lets an EDITOR authorize platform-wide and run a read tool', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const mcpClient = await connectAs({ ctx: member })

        await mcpClientHelpers.callTool({ app, mcpClient, name: 'ap_set_project_context', args: { projectId: ctx.project.id } })
        const listed = await mcpClientHelpers.callTool({ app, mcpClient, name: LOCKED_TOOL })

        expect(listed).not.toContain('Permission denied')
    })

    it("applies the selected project's switched-off tools to a platform client", async () => {
        const ctx = await createTestContext(app)
        const restricted = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            displayName: `project-${apId()}`,
        })
        await db.save('project', restricted)
        await db.save('mcp_server', {
            id: apId(),
            projectId: restricted.id,
            platformId: null,
            type: McpServerType.PROJECT,
            token: apId(72),
            disabledTools: [SWITCHED_OFF_TOOL],
        })
        const mcpClient = await connectAs({ ctx })

        await mcpClientHelpers.callTool({ app, mcpClient, name: 'ap_set_project_context', args: { projectId: restricted.id } })
        const refused = await mcpClientHelpers.callTool({ app, mcpClient, name: SWITCHED_OFF_TOOL, args: { flowName: 'blocked-flow' } })

        expect(refused).toContain('switched off for the selected project')
    })

    it('reports the platform switched-off tools on the project MCP server route', async () => {
        const ctx = await createTestContext(app)
        await db.save('mcp_server', {
            id: apId(),
            projectId: null,
            platformId: ctx.platform.id,
            type: McpServerType.PLATFORM,
            token: apId(72),
            disabledTools: [SWITCHED_OFF_TOOL],
        })

        const response = await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)

        expect(response.json().platformDisabledTools).toEqual([SWITCHED_OFF_TOOL])
    })

    it('lets a platform admin run a piece-catalog tool on the platform server', async () => {
        const ctx = await createTestContext(app)
        const mcpClient = await connectAs({ ctx })

        const researched = await mcpClientHelpers.callTool({ app, mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })

        expect(researched).not.toContain('Permission denied')
    })

    it('lets an operator who belongs to no project reach the platform tools and any project', async () => {
        const ctx = await createTestContext(app)
        const mcpClient = await connectAsOperator({ ctx })

        const researched = await mcpClientHelpers.callTool({ app, mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })
        const selected = await mcpClientHelpers.callTool({ app, mcpClient, name: 'ap_set_project_context', args: { projectId: ctx.project.id } })
        const listed = await mcpClientHelpers.callTool({ app, mcpClient, name: LOCKED_TOOL })

        expect(researched).not.toContain('Permission denied')
        expect(selected).toContain('Project context set')
        expect(listed).not.toContain('Permission denied')
    })
})
