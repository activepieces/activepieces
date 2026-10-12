import { apId, Permission, RoleType } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mcpOAuthTokenService } from '../../../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { db } from '../../../helpers/db'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMockProjectRole } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function setup({ permissions }: { permissions: Permission[] }): Promise<{ owner: TestContext, member: TestContext }> {
    const owner = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
    const role = createMockProjectRole({
        platformId: owner.platform.id,
        name: `custom-${apId()}`,
        permissions,
        type: RoleType.CUSTOM,
    })
    await db.save('project_role', role)
    const member = await createMemberContext(app, owner, { projectRole: role.name })
    return { owner, member }
}

async function startConversation({ ctx, projectId }: { ctx: TestContext, projectId: string }): Promise<string> {
    const response = await ctx.post('/v1/agents/conversations', {})
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    const conversationId = response.json().id
    await db.update('agent_conversation', conversationId, { projectId })
    return conversationId
}

async function chatClient({ ctx, conversationId }: { ctx: TestContext, conversationId: string }): Promise<McpClient> {
    const accessToken = await mcpOAuthTokenService.issueInternalAccessToken({ userId: ctx.user.id, platformId: ctx.platform.id, projectId: null })
    return { accessToken, endpoint: '/mcp/platform', conversationId }
}

describe('In-app AI Chat on the MCP server', () => {
    it('runs a project tool for a member whose role lacks READ_MCP but grants the tool\'s permission', async () => {
        const { owner, member } = await setup({ permissions: [Permission.READ_FLOW] })
        const conversationId = await startConversation({ ctx: member, projectId: owner.project.id })

        const text = await mcpClientHelpers.callTool({ app, mcpClient: await chatClient({ ctx: member, conversationId }), name: 'ap_list_flows' })

        expect(text).toContain('✅')
        expect(text).not.toContain(Permission.READ_MCP)
    })

    it('still denies a tool whose own permission the role does not grant', async () => {
        const { owner, member } = await setup({ permissions: [Permission.READ_FLOW] })
        const conversationId = await startConversation({ ctx: member, projectId: owner.project.id })

        const text = await mcpClientHelpers.callTool({ app, mcpClient: await chatClient({ ctx: member, conversationId }), name: 'ap_create_flow', args: { flowName: 'Chat Flow' } })

        expect(text).toContain('Permission denied')
        expect(text).toContain(Permission.WRITE_FLOW)
    })

    it('keeps the READ_MCP gate on a project-scoped token from the /token route', async () => {
        const { owner, member } = await setup({ permissions: [Permission.READ_FLOW] })
        const accessToken = await mcpOAuthTokenService.issueInternalAccessToken({ userId: member.user.id, platformId: owner.platform.id, projectId: owner.project.id })

        const text = await mcpClientHelpers.callTool({ app, mcpClient: { accessToken, endpoint: '/mcp' }, name: 'ap_list_flows' })

        expect(text).toContain('Permission denied')
        expect(text).toContain(Permission.READ_MCP)
    })

    it('gives no project access through a conversation that belongs to someone else', async () => {
        const { owner, member } = await setup({ permissions: [Permission.READ_FLOW] })
        const ownerConversationId = await startConversation({ ctx: owner, projectId: owner.project.id })

        const text = await mcpClientHelpers.callTool({ app, mcpClient: await chatClient({ ctx: member, conversationId: ownerConversationId }), name: 'ap_list_flows' })

        expect(text).not.toContain('✅')
        expect(text).toContain('No project selected')
    })

    it('keeps the platform-wide tools gated when the conversation has no project', async () => {
        const { member } = await setup({ permissions: [Permission.READ_FLOW] })
        const response = await member.post('/v1/agents/conversations', {})
        const conversationId = response.json().id

        const text = await mcpClientHelpers.callTool({ app, mcpClient: await chatClient({ ctx: member, conversationId }), name: 'ap_set_project_context' })

        expect(text).toContain('Permission denied')
        expect(text).toContain(Permission.READ_MCP)
    })

    it('keeps working for a member whose role grants READ_MCP', async () => {
        const { owner, member } = await setup({ permissions: [Permission.READ_FLOW, Permission.READ_MCP] })
        const conversationId = await startConversation({ ctx: member, projectId: owner.project.id })

        const text = await mcpClientHelpers.callTool({ app, mcpClient: await chatClient({ ctx: member, conversationId }), name: 'ap_list_flows' })

        expect(text).toContain('✅')
    })
})
