import { isNil } from '@activepieces/core-utils'
import { DefaultProjectRole, McpToolDefinition } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { platformAdminTools } from '../../../../src/app/mcp/platform-admin/platform-admin-tools'
import { db } from '../../../helpers/db'
import { mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app, { plan: { apiKeysEnabled: true } })
})

describe('platform admin MCP tools', () => {
    it('lets an admin read API keys', async () => {
        const listed = await run({ userId: ctx.user.id, tool: 'ap_platform_read', args: { path: '/api/v1/api-keys' } })
        expect(listed).toContain('HTTP 200')
    })

    it('gives a member the same 403 the UI would', async () => {
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        const result = await run({ userId: member.user.id, tool: 'ap_platform_read', args: { path: '/api/v1/api-keys' } })
        expect(result).toContain('HTTP 403')
    })

    it('refuses routes marked deny and routes no page exposes', async () => {
        const createKey = await run({ userId: ctx.user.id, tool: 'ap_platform_write', args: { method: 'POST', path: '/api/v1/api-keys', body: { displayName: 'ci' } } })
        expect(createKey).toContain('not available to MCP tools')

        const deletePlatform = await run({ userId: ctx.user.id, tool: 'ap_platform_write', args: { method: 'DELETE', path: `/api/v1/platforms/${ctx.platform.id}` } })
        expect(deletePlatform).toContain('not available to MCP tools')
        expect(await db.findOneBy('platform', { id: ctx.platform.id })).not.toBeNull()

        const flags = await run({ userId: ctx.user.id, tool: 'ap_platform_read', args: { path: '/api/v1/flags' } })
        expect(flags).toContain('not available to MCP tools')
    })

    it('returns the request schema when the body is wrong', async () => {
        const result = await run({ userId: ctx.user.id, tool: 'ap_platform_write', args: { method: 'POST', path: '/api/v1/project-roles', body: {} } })
        expect(result).toContain('HTTP 400')
        expect(result).toContain('Fix the request to match this schema')
    })

    it('rejects paths outside /api/v1 before calling anything', async () => {
        await expect(run({ userId: ctx.user.id, tool: 'ap_platform_read', args: { path: '/api/v1/../v1/api-keys' } })).rejects.toThrow()
        await expect(run({ userId: ctx.user.id, tool: 'ap_platform_read', args: { path: '/api/v1/api-keys%2F..' } })).rejects.toThrow()
        await expect(run({ userId: ctx.user.id, tool: 'ap_platform_read', args: { path: '/api/v1/api-keys%2e%2e' } })).rejects.toThrow()
        expect(await run({ userId: ctx.user.id, tool: 'ap_platform_read', args: { path: '/api/v1/project-roles/Run%20viewer' } })).toContain('HTTP')
    })

    it('lists the admin pages and explains one with its endpoints', async () => {
        const index = await run({ userId: ctx.user.id, tool: 'ap_platform_guide', args: {} })
        expect(index).toContain('admin-guide/guides/api-keys')

        const page = await run({ userId: ctx.user.id, tool: 'ap_platform_guide', args: { page: 'admin-guide/guides/api-keys' } })
        expect(page).toContain('# API Keys')
        expect(page).toContain('GET /api/v1/api-keys')
        expect(page).not.toContain('POST /api/v1/api-keys')

        const streaming = await run({ userId: ctx.user.id, tool: 'ap_platform_guide', args: { page: 'admin-guide/guides/event-streaming' } })
        expect(streaming).toContain('http://<agent-host>:4318/v1/logs')
    })
})

describe('which MCP clients get the platform admin tools', () => {
    it('gives them to an admin on a platform grant, and drops write when the platform switches it off', async () => {
        const tools = await toolNames({ ctx })
        expect(tools).toEqual(expect.arrayContaining(ADMIN_TOOLS))

        await ctx.post('/v1/mcp-server', { disabledTools: ['ap_platform_write'] })
        const afterSwitchOff = await toolNames({ ctx })
        expect(afterSwitchOff).toContain('ap_platform_read')
        expect(afterSwitchOff).not.toContain('ap_platform_write')
    })

    it('keeps them from a member and from a project-scoped grant', async () => {
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        expect(await toolNames({ ctx: member })).not.toEqual(expect.arrayContaining(['ap_platform_read']))
        expect(await toolNames({ ctx, projectId: ctx.project.id })).not.toEqual(expect.arrayContaining(['ap_platform_read']))
    })
})

async function toolNames({ ctx: client, projectId }: { ctx: TestContext, projectId?: string }): Promise<string[]> {
    const mcpClient = await mcpClientHelpers.connect({ app, projectId, approve: (payload) => client.post('/v1/mcp-oauth/approve', payload) })
    return mcpClientHelpers.listToolNames({ app, mcpClient })
}

async function run({ userId, tool, args }: { userId: string, tool: string, args: Record<string, unknown> }): Promise<string> {
    const definition = platformAdminTools({ userId, log: app.log }).find((candidate: McpToolDefinition) => candidate.title === tool)
    if (isNil(definition)) {
        throw new Error(`Unknown tool ${tool}`)
    }
    const result = await definition.execute(args)
    return result.content.map((part) => part.type === 'text' ? part.text : '').join('\n')
}

const ADMIN_TOOLS = ['ap_platform_guide', 'ap_platform_read', 'ap_platform_write']
