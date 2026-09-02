import { AgentRunSource, apId, DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentApprovalGate } from '../../../../src/app/ee/agent/agent-approval-gate'
import { db } from '../../../helpers/db'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    process.env.AP_AGENTS_ENABLED = 'true'
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function conversationWithPendingGate(ctx: TestContext): Promise<string> {
    const conversationId = apId()
    await db.save('agent_conversation', {
        id: conversationId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: ctx.platform.id,
        projectId: ctx.project.id,
        userId: ctx.user.id,
        source: AgentRunSource.AGENT,
        status: 'STREAMING',
        messages: [],
        uiMessages: [],
    })
    const gateId = `gate-${conversationId}`
    await agentApprovalGate.storePendingGate({
        conversationId,
        gate: { gateId, toolName: 'gmail-send_email', displayName: 'Send email', toolInput: { pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { to: 'jane@customer.com' } } },
    })
    return gateId
}

describe('approving an agent action belongs to the person it was shown to', () => {
    it('lets the conversation owner approve their own pending action', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const gateId = await conversationWithPendingGate(ctx)

        const response = await ctx.post(`/v1/agents/tool-approvals/${gateId}`, { approved: true })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('refuses someone else in the platform approving an action they were never shown', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const gateId = await conversationWithPendingGate(ctx)
        const other = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })

        const response = await other.post(`/v1/agents/tool-approvals/${gateId}`, { approved: true })

        expect(response.statusCode).not.toBe(StatusCodes.OK)
        expect(await agentApprovalGate.checkDecision({ gateId })).toBe('pending')
    })
})
