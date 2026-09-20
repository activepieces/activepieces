import { apId, Permission, ProjectRole, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, McpServerType, PlatformRole, PrincipalType, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMockProject, createMockProjectMember, createMockProjectRole, mockBasicUser } from '../../../helpers/mocks'
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

async function connectAs({ ctx, projectId }: { ctx: TestContext, projectId?: string }): Promise<McpClient> {
    return mcpClientHelpers.connect({
        app,
        approve: (payload) => ctx.post('/v1/mcp-oauth/approve', payload),
        ...(projectId ? { projectId } : {}),
    })
}

function call({ mcpClient, name, args }: { mcpClient: McpClient, name: string, args?: Record<string, unknown> }): Promise<string> {
    return mcpClientHelpers.callTool({ app, mcpClient, name, args })
}

function selectProject({ mcpClient, projectId }: { mcpClient: McpClient, projectId: string }): Promise<string> {
    return call({ mcpClient, name: 'ap_set_project_context', args: { projectId } })
}

async function createCustomRoleMember({ ctx, permissions }: { ctx: TestContext, permissions: Permission[] }): Promise<{ member: TestContext, role: ProjectRole }> {
    const role = createMockProjectRole({
        platformId: ctx.platform.id,
        name: `role-${apId()}`,
        permissions,
        type: RoleType.CUSTOM,
    })
    await db.save('project_role', role)
    const member = await createMemberContext(app, ctx, { projectRole: role.name })
    return { member, role }
}

async function createSiblingProject({ ctx, disabledTools }: { ctx: TestContext, disabledTools?: string[] }): Promise<Project> {
    const project = createMockProject({
        platformId: ctx.platform.id,
        ownerId: ctx.user.id,
        displayName: `project-${apId()}`,
    })
    await db.save('project', project)
    if (disabledTools) {
        await db.save('mcp_server', {
            id: apId(),
            projectId: project.id,
            platformId: null,
            type: McpServerType.PROJECT,
            token: apId(72),
            disabledTools,
        })
    }
    return project
}

async function grantMemberAccess({ ctx, member, projectId, permissions }: {
    ctx: TestContext
    member: TestContext
    projectId: string
    permissions: Permission[]
}): Promise<void> {
    const role = createMockProjectRole({
        platformId: ctx.platform.id,
        name: `role-${apId()}`,
        permissions,
        type: RoleType.CUSTOM,
    })
    await db.save('project_role', role)
    await db.save('project_member', createMockProjectMember({
        userId: member.user.id,
        platformId: ctx.platform.id,
        projectId,
        projectRoleId: role.id,
    }))
}

async function createPlatformUser({ ctx, platformRole }: { ctx: TestContext, platformRole: PlatformRole }): Promise<PlatformUser> {
    const { mockUser } = await mockBasicUser({
        user: {
            platformId: ctx.platform.id,
            platformRole,
        },
    })
    const token = await generateMockToken({
        id: mockUser.id,
        type: PrincipalType.USER,
        platform: { id: ctx.platform.id },
    })
    return {
        approve: (payload) => app.inject({
            method: 'POST',
            url: '/api/v1/mcp-oauth/approve',
            headers: { authorization: `Bearer ${token}` },
            payload,
        }),
    }
}

describe('platform MCP end to end, for a member', () => {
    it('lets an EDITOR connect, select their project and run a read tool', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const mcpClient = await connectAs({ ctx: member })

        const selected = await selectProject({ mcpClient, projectId: ctx.project.id })
        const listed = await call({ mcpClient, name: LOCKED_TOOL })

        expect(selected).toContain('Project context set')
        expect(listed).not.toContain('Permission denied')
    })

    it('refuses a VIEWER a write tool while allowing a read tool', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })
        const mcpClient = await connectAs({ ctx: member })
        await selectProject({ mcpClient, projectId: ctx.project.id })

        const created = await call({ mcpClient, name: SWITCHED_OFF_TOOL, args: { flowName: 'viewer-flow' } })
        const listed = await call({ mcpClient, name: LOCKED_TOOL })

        expect(created).toContain('Permission denied')
        expect(created).toContain(Permission.WRITE_FLOW)
        expect(listed).not.toContain('Permission denied')
    })

    it('refuses the next call on a token already issued once READ_MCP is taken away', async () => {
        const ctx = await createTestContext(app)
        const { member, role } = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const mcpClient = await connectAs({ ctx: member })
        await selectProject({ mcpClient, projectId: ctx.project.id })
        expect(await call({ mcpClient, name: LOCKED_TOOL })).not.toContain('Permission denied')

        await db.update('project_role', role.id, { permissions: [Permission.READ_FLOW] })

        expect(await call({ mcpClient, name: LOCKED_TOOL })).toContain(Permission.READ_MCP)
    })

    it('stops a member selecting a project where their role lacks READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const { member } = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const otherProject = await createSiblingProject({ ctx })
        await grantMemberAccess({ ctx, member, projectId: otherProject.id, permissions: [Permission.READ_FLOW] })
        const mcpClient = await connectAs({ ctx: member })

        const selected = await selectProject({ mcpClient, projectId: otherProject.id })

        expect(selected).toContain("don't have access")
        expect(selected).not.toContain(otherProject.id.concat(')'))
    })

    it('stops a member selecting a project in another platform', async () => {
        const ctx = await createTestContext(app)
        const otherPlatform = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const mcpClient = await connectAs({ ctx: member })

        const selected = await selectProject({ mcpClient, projectId: otherPlatform.project.id })

        expect(selected).toContain("don't have access")
    })

    it('lets a member reach a second project once a role there grants READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const { member } = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const otherProject = await createSiblingProject({ ctx })
        await grantMemberAccess({ ctx, member, projectId: otherProject.id, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const mcpClient = await connectAs({ ctx: member })

        const selected = await selectProject({ mcpClient, projectId: otherProject.id })
        const listed = await call({ mcpClient, name: LOCKED_TOOL })

        expect(selected).toContain('Project context set')
        expect(listed).not.toContain('Permission denied')
    })
})

describe('platform MCP tools configuration, as an admin', () => {
    it('refuses a tool the selected project switched off, and runs it where it is on', async () => {
        const ctx = await createTestContext(app)
        const restricted = await createSiblingProject({ ctx, disabledTools: [SWITCHED_OFF_TOOL] })
        const mcpClient = await connectAs({ ctx })

        await selectProject({ mcpClient, projectId: restricted.id })
        const refused = await call({ mcpClient, name: SWITCHED_OFF_TOOL, args: { flowName: 'blocked-flow' } })

        await selectProject({ mcpClient, projectId: ctx.project.id })
        const created = await call({ mcpClient, name: SWITCHED_OFF_TOOL, args: { flowName: 'allowed-flow' } })

        expect(refused).toContain('switched off for the selected project')
        expect(created).toContain('allowed-flow')
    })

    it('keeps a switched-off tool in the tool list, because the project is chosen after connecting', async () => {
        const ctx = await createTestContext(app)
        const restricted = await createSiblingProject({ ctx, disabledTools: [SWITCHED_OFF_TOOL] })
        const mcpClient = await connectAs({ ctx })
        await selectProject({ mcpClient, projectId: restricted.id })

        const toolNames = await mcpClientHelpers.listToolNames({ app, mcpClient })

        expect(toolNames).toContain(SWITCHED_OFF_TOOL)
    })

    it('keeps a locked tool callable even when the project lists it in disabledTools', async () => {
        const ctx = await createTestContext(app)
        const restricted = await createSiblingProject({ ctx, disabledTools: [SWITCHED_OFF_TOOL, LOCKED_TOOL] })
        const mcpClient = await connectAs({ ctx })
        await selectProject({ mcpClient, projectId: restricted.id })

        const listed = await call({ mcpClient, name: LOCKED_TOOL })

        expect(listed).not.toContain('switched off')
    })

    it('drops a tool the platform server switched off from the tool list entirely', async () => {
        const ctx = await createTestContext(app)
        await db.save('mcp_server', {
            id: apId(),
            projectId: null,
            platformId: ctx.platform.id,
            type: McpServerType.PLATFORM,
            token: apId(72),
            disabledTools: [SWITCHED_OFF_TOOL],
        })
        const mcpClient = await connectAs({ ctx })
        await selectProject({ mcpClient, projectId: ctx.project.id })

        const toolNames = await mcpClientHelpers.listToolNames({ app, mcpClient })

        expect(toolNames).not.toContain(SWITCHED_OFF_TOOL)
        expect(toolNames).toContain(LOCKED_TOOL)
    })

    it('lands a switch back on at the next call, with no reconnect', async () => {
        const ctx = await createTestContext(app)
        const restricted = await createSiblingProject({ ctx, disabledTools: [SWITCHED_OFF_TOOL] })
        const mcpClient = await connectAs({ ctx })
        await selectProject({ mcpClient, projectId: restricted.id })
        expect(await call({ mcpClient, name: SWITCHED_OFF_TOOL, args: { flowName: 'first-try' } })).toContain('switched off')

        const saved = await ctx.post(`/v1/projects/${restricted.id}/mcp-server`, { disabledTools: [] })
        expect(saved.statusCode).toBe(200)

        expect(await call({ mcpClient, name: SWITCHED_OFF_TOOL, args: { flowName: 'second-try' } })).toContain('second-try')
    })
})

describe('project-scoped MCP end to end', () => {
    it('lets a member authorize their own project and run a read tool', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })

        const mcpClient = await connectAs({ ctx: member, projectId: ctx.project.id })
        const listed = await call({ mcpClient, name: LOCKED_TOOL })

        expect(listed).not.toContain('Permission denied')
    })

    it('refuses every tool on the project server once READ_MCP is taken away', async () => {
        const ctx = await createTestContext(app)
        const { member, role } = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const mcpClient = await connectAs({ ctx: member, projectId: ctx.project.id })
        expect(await call({ mcpClient, name: LOCKED_TOOL })).not.toContain('Permission denied')

        await db.update('project_role', role.id, { permissions: [Permission.READ_FLOW] })

        expect(await call({ mcpClient, name: LOCKED_TOOL })).toContain(Permission.READ_MCP)
    })

    it('refuses a piece-catalog tool on the project server once READ_MCP is taken away', async () => {
        const ctx = await createTestContext(app)
        const { member, role } = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const mcpClient = await connectAs({ ctx: member, projectId: ctx.project.id })

        await db.update('project_role', role.id, { permissions: [Permission.READ_FLOW] })

        expect(await call({ mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })).toContain(Permission.READ_MCP)
    })

    it('refuses project selection on the platform server once READ_MCP is taken away', async () => {
        const ctx = await createTestContext(app)
        const { member, role } = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const mcpClient = await connectAs({ ctx: member })

        await db.update('project_role', role.id, { permissions: [Permission.READ_FLOW] })

        expect(await selectProject({ mcpClient, projectId: ctx.project.id })).toContain(Permission.READ_MCP)
    })

    it('refuses a piece-catalog tool on the platform server once READ_MCP is taken away', async () => {
        const ctx = await createTestContext(app)
        const { member, role } = await createCustomRoleMember({ ctx, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const mcpClient = await connectAs({ ctx: member })
        await selectProject({ mcpClient, projectId: ctx.project.id })

        await db.update('project_role', role.id, { permissions: [Permission.READ_FLOW] })

        expect(await call({ mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })).toContain(Permission.READ_MCP)
    })
})

describe('platform MCP end to end, for a privileged user', () => {
    it('lets a platform admin run a piece-catalog tool on the platform server', async () => {
        const ctx = await createTestContext(app)
        const mcpClient = await connectAs({ ctx })

        const researched = await call({ mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })

        expect(researched).not.toContain('Permission denied')
    })

    it('lets a platform admin select a project and run a read tool', async () => {
        const ctx = await createTestContext(app)
        const mcpClient = await connectAs({ ctx })

        const selected = await selectProject({ mcpClient, projectId: ctx.project.id })
        const listed = await call({ mcpClient, name: LOCKED_TOOL })

        expect(selected).toContain('Project context set')
        expect(listed).not.toContain('Permission denied')
    })

    it('lets an operator who belongs to no project run a piece-catalog tool', async () => {
        const ctx = await createTestContext(app)
        const operator = await createPlatformUser({ ctx, platformRole: PlatformRole.OPERATOR })
        const mcpClient = await mcpClientHelpers.connect({ app, approve: operator.approve })

        const researched = await call({ mcpClient, name: PIECE_CATALOG_TOOL, args: { query: 'slack' } })

        expect(researched).not.toContain('Permission denied')
    })

    it('lets an operator select a project they are no member of, and run a read tool there', async () => {
        const ctx = await createTestContext(app)
        const operator = await createPlatformUser({ ctx, platformRole: PlatformRole.OPERATOR })
        const mcpClient = await mcpClientHelpers.connect({ app, approve: operator.approve })

        const selected = await selectProject({ mcpClient, projectId: ctx.project.id })
        const listed = await call({ mcpClient, name: LOCKED_TOOL })

        expect(selected).toContain('Project context set')
        expect(listed).not.toContain('Permission denied')
    })

    it('stops an operator selecting a project in another platform', async () => {
        const ctx = await createTestContext(app)
        const otherPlatform = await createTestContext(app)
        const operator = await createPlatformUser({ ctx, platformRole: PlatformRole.OPERATOR })
        const mcpClient = await mcpClientHelpers.connect({ app, approve: operator.approve })

        const selected = await selectProject({ mcpClient, projectId: otherPlatform.project.id })

        expect(selected).toContain("don't have access")
    })

    it('refuses a member who is privileged nowhere, on the same platform the operator reaches', async () => {
        const ctx = await createTestContext(app)
        const stranger = await createPlatformUser({ ctx, platformRole: PlatformRole.MEMBER })

        const response = await stranger.approve({ authRequestId: 'unused' })

        expect(response.statusCode).toBe(403)
    })
})

type PlatformUser = {
    approve: (payload: { authRequestId: string, projectId?: string }) => ReturnType<FastifyInstance['inject']>
}
