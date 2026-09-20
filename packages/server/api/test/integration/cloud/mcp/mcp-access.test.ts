import { apId, Permission, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, PlatformRole, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mcpAccess } from '../../../../src/app/mcp/mcp-access'
import { db } from '../../../helpers/db'
import { createMockProject, createMockProjectRole, mockBasicUser } from '../../../helpers/mocks'
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

describe('mcpAccess.listAccessibleProjects', () => {
    it('returns every project for a privileged (admin) user', async () => {
        const ctx = await createTestContext(app)

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: ctx.user.id, log: mockLog })

        expect(projects.map(p => p.id)).toContain(ctx.project.id)
    })

    it('includes a project whose member role grants READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: member.user.id, log: mockLog })

        expect(projects.map(p => p.id)).toContain(ctx.project.id)
    })

    it('excludes a project whose member role lacks READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const roleWithoutMcp = createMockProjectRole({
            platformId: ctx.platform.id,
            name: `no-mcp-${apId()}`,
            permissions: [Permission.READ_FLOW],
            type: RoleType.CUSTOM,
        })
        await db.save('project_role', roleWithoutMcp)
        const member = await createMemberContext(app, ctx, { projectRole: roleWithoutMcp.name })

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: member.user.id, log: mockLog })

        expect(projects).toHaveLength(0)
    })

    it('grants no MCP reach to a member without a personal project, as when autoCreatePersonalProjects is off', async () => {
        const ctx = await createTestContext(app, { platform: { autoCreatePersonalProjects: false } })
        const roleWithoutMcp = createMockProjectRole({
            platformId: ctx.platform.id,
            name: `no-mcp-${apId()}`,
            permissions: [Permission.READ_FLOW, Permission.WRITE_FLOW],
            type: RoleType.CUSTOM,
        })
        await db.save('project_role', roleWithoutMcp)
        const member = await createMemberContext(app, ctx, { projectRole: roleWithoutMcp.name })

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: member.user.id, log: mockLog })

        expect(projects).toHaveLength(0)
    })

    it('returns nothing for a member who has no project at all', async () => {
        const ctx = await createTestContext(app)
        const { mockUser: stranger } = await mockBasicUser({
            user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER },
        })

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: stranger.id, log: mockLog })

        expect(projects).toHaveLength(0)
    })

    it('includes a project the member owns, which grants them the admin role', async () => {
        const ctx = await createTestContext(app)
        const { mockUser: owner } = await mockBasicUser({
            user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER },
        })
        const ownedProject = createMockProject({
            platformId: ctx.platform.id,
            ownerId: owner.id,
            type: ProjectType.PERSONAL,
        })
        await db.save('project', ownedProject)

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: owner.id, log: mockLog })

        expect(projects.map(p => p.id)).toEqual([ownedProject.id])
    })

    it('keeps an operator on every project in the platform', async () => {
        const ctx = await createTestContext(app)
        const { mockUser: operator } = await mockBasicUser({
            user: { platformId: ctx.platform.id, platformRole: PlatformRole.OPERATOR },
        })
        const someonesPersonalProject = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            type: ProjectType.PERSONAL,
        })
        await db.save('project', someonesPersonalProject)

        const projects = await mcpAccess.listAccessibleProjects({ platformId: ctx.platform.id, userId: operator.id, log: mockLog })
        const projectIds = projects.map(p => p.id)

        expect(projectIds).toContain(ctx.project.id)
        expect(projectIds).toContain(someonesPersonalProject.id)
    })
})

describe('GET /v1/mcp-server/reach', () => {
    it('answers a member with only the projects where their role grants READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const unreachable = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            displayName: `project-${apId()}`,
        })
        await db.save('project', unreachable)

        const response = await member.get('/v1/mcp-server/reach')

        expect(response.statusCode).toBe(200)
        expect(response.json().projectIds).toEqual([ctx.project.id])
    })

    it('answers a member holding READ_MCP nowhere with an empty list', async () => {
        const ctx = await createTestContext(app)
        const roleWithoutMcp = createMockProjectRole({
            platformId: ctx.platform.id,
            name: `no-mcp-${apId()}`,
            permissions: [Permission.READ_FLOW],
            type: RoleType.CUSTOM,
        })
        await db.save('project_role', roleWithoutMcp)
        const member = await createMemberContext(app, ctx, { projectRole: roleWithoutMcp.name })

        const response = await member.get('/v1/mcp-server/reach')

        expect(response.statusCode).toBe(200)
        expect(response.json().projectIds).toEqual([])
    })

    it('answers a platform admin with every project, without making them one', async () => {
        const ctx = await createTestContext(app)
        const sibling = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            displayName: `project-${apId()}`,
        })
        await db.save('project', sibling)

        const response = await ctx.get('/v1/mcp-server/reach')

        expect(response.statusCode).toBe(200)
        expect(response.json().projectIds).toEqual(expect.arrayContaining([ctx.project.id, sibling.id]))
    })

    it('never answers with the platform server token, unlike the admin-only route beside it', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })

        const reach = await member.get('/v1/mcp-server/reach')
        const adminOnly = await member.get('/v1/mcp-server')

        expect(Object.keys(reach.json())).toEqual(['projectIds'])
        expect(adminOnly.statusCode).toBe(403)
    })
})
