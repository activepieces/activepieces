import { apId, Permission, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, McpServerType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { createMockProjectRole } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const PLATFORM_SWITCHED_OFF_TOOL = 'ap_delete_flow'
const PROJECT_SWITCHED_OFF_TOOL = 'ap_create_flow'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function switchOffOnPlatform({ ctx, tools }: { ctx: TestContext, tools: string[] }): Promise<void> {
    await db.save('mcp_server', {
        id: apId(),
        projectId: null,
        platformId: ctx.platform.id,
        type: McpServerType.PLATFORM,
        token: apId(72),
        disabledTools: tools,
    })
}

describe('GET /v1/projects/:projectId/mcp-server', () => {
    it('reports the platform tools an admin switched off, beside the project ones', async () => {
        const ctx = await createTestContext(app)
        await switchOffOnPlatform({ ctx, tools: [PLATFORM_SWITCHED_OFF_TOOL] })
        await ctx.post(`/v1/projects/${ctx.project.id}/mcp-server`, { disabledTools: [PROJECT_SWITCHED_OFF_TOOL] })

        const response = await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)

        expect(response.statusCode).toBe(200)
        expect(response.json().disabledTools).toEqual([PROJECT_SWITCHED_OFF_TOOL])
        expect(response.json().platformDisabledTools).toEqual([PLATFORM_SWITCHED_OFF_TOOL])
    })

    it('reports an empty platform list when the platform switched nothing off', async () => {
        const ctx = await createTestContext(app)

        const response = await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)

        expect(response.json().platformDisabledTools).toEqual([])
    })

    it('reads the platform list without creating a platform server row', async () => {
        const ctx = await createTestContext(app)

        const response = await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)

        expect(response.statusCode).toBe(200)
        expect(await db.findBy('mcp_server', { platformId: ctx.platform.id })).toEqual([])
    })

    it('keeps the platform list on the save response, so the page does not lose it', async () => {
        const ctx = await createTestContext(app)
        await switchOffOnPlatform({ ctx, tools: [PLATFORM_SWITCHED_OFF_TOOL] })

        const response = await ctx.post(`/v1/projects/${ctx.project.id}/mcp-server`, { disabledTools: [PROJECT_SWITCHED_OFF_TOOL] })

        expect(response.json().platformDisabledTools).toEqual([PLATFORM_SWITCHED_OFF_TOOL])
    })

    it('shows a member the platform list too, on READ_MCP alone', async () => {
        const ctx = await createTestContext(app)
        await switchOffOnPlatform({ ctx, tools: [PLATFORM_SWITCHED_OFF_TOOL] })
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

        const response = await member.get(`/v1/projects/${ctx.project.id}/mcp-server`)

        expect(response.statusCode).toBe(200)
        expect(response.json().platformDisabledTools).toEqual([PLATFORM_SWITCHED_OFF_TOOL])
    })

    it('refuses a member whose role lacks READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const role = createMockProjectRole({
            platformId: ctx.platform.id,
            name: `role-${apId()}`,
            permissions: [Permission.READ_FLOW],
            type: RoleType.CUSTOM,
        })
        await db.save('project_role', role)
        const member = await createMemberContext(app, ctx, { projectRole: role.name })

        const response = await member.get(`/v1/projects/${ctx.project.id}/mcp-server`)

        expect(response.statusCode).toBe(403)
    })

    it('refuses a VIEWER the save, because it needs WRITE_MCP', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

        const response = await member.post(`/v1/projects/${ctx.project.id}/mcp-server`, { disabledTools: [PROJECT_SWITCHED_OFF_TOOL] })

        expect(response.statusCode).toBe(403)
    })

    it('never leaks the platform server token to a project member', async () => {
        const ctx = await createTestContext(app)
        await switchOffOnPlatform({ ctx, tools: [PLATFORM_SWITCHED_OFF_TOOL] })
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

        const platformMcp = await db.findOneByOrFail<{ token: string }>('mcp_server', { platformId: ctx.platform.id })
        const response = await member.get(`/v1/projects/${ctx.project.id}/mcp-server`)

        expect(response.body).not.toContain(platformMcp.token)
    })
})
