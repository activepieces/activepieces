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

describe('mcpAccess.listMcpAccessibleProjects', () => {
    it('returns every project for a privileged (admin) user', async () => {
        const ctx = await createTestContext(app)

        const projects = await mcpAccess.listMcpAccessibleProjects({ platformId: ctx.platform.id, userId: ctx.user.id, log: mockLog })

        expect(projects.map(p => p.id)).toContain(ctx.project.id)
    })

    it('includes a project whose member role grants READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })

        const projects = await mcpAccess.listMcpAccessibleProjects({ platformId: ctx.platform.id, userId: member.user.id, log: mockLog })

        expect(projects.map(p => p.id)).toContain(ctx.project.id)
    })

    it('gives an operator team projects but not other users\' personal projects', async () => {
        const ctx = await createTestContext(app)
        const { mockUser: operator } = await mockBasicUser({
            user: { platformId: ctx.platform.id, platformRole: PlatformRole.OPERATOR },
        })
        const otherPersonalProject = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            type: ProjectType.PERSONAL,
        })
        await db.save('project', otherPersonalProject)

        const projects = await mcpAccess.listMcpAccessibleProjects({ platformId: ctx.platform.id, userId: operator.id, log: mockLog })
        const ids = projects.map(p => p.id)

        expect(ids).toContain(ctx.project.id)
        expect(ids).not.toContain(otherPersonalProject.id)
    })

    it('excludes a project whose member role lacks READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const noMcpRole = createMockProjectRole({
            platformId: ctx.platform.id,
            name: `no-mcp-${apId()}`,
            permissions: [Permission.READ_FLOW],
            type: RoleType.CUSTOM,
        })
        await db.save('project_role', noMcpRole)
        const member = await createMemberContext(app, ctx, { projectRole: noMcpRole.name })

        const projects = await mcpAccess.listMcpAccessibleProjects({ platformId: ctx.platform.id, userId: member.user.id, log: mockLog })

        expect(projects.map(p => p.id)).not.toContain(ctx.project.id)
    })
})
