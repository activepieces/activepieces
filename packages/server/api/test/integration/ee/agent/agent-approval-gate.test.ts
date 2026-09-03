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

async function conversation(ctx: TestContext): Promise<string> {
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
    return conversationId
}

async function openGate({ conversationId, gateId, actionName }: { conversationId: string, gateId: string, actionName: string }): Promise<void> {
    await agentApprovalGate.storePendingGate({
        conversationId,
        gate: { gateId, toolName: `slack-${actionName}`, displayName: actionName, toolInput: { pieceName: '@activepieces/piece-slack', actionName, input: { to: 'jane@customer.com' } } },
    })
}

async function conversationWithPendingGate(ctx: TestContext): Promise<string> {
    const conversationId = await conversation(ctx)
    const gateId = `gate-${conversationId}`
    await openGate({ conversationId, gateId, actionName: 'send_email' })
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

describe('a turn that opens several actions at once keeps a card for each', () => {
    it('hands over the second action once the first has been answered', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const conversationId = await conversation(ctx)
        await openGate({ conversationId, gateId: 'gate-first', actionName: 'set_user_status' })
        await openGate({ conversationId, gateId: 'gate-second', actionName: 'send_channel_message' })

        const both = await agentApprovalGate.getPendingGates({ conversationId })
        expect(both.map((gate) => gate.gateId).sort()).toEqual(['gate-first', 'gate-second'])

        await agentApprovalGate.resolveGate({ gateId: 'gate-first', approved: true })

        const left = await agentApprovalGate.getPendingGates({ conversationId })
        expect(left.map((gate) => gate.gateId)).toEqual(['gate-second'])
    })

    it('binds each decision to the action it was shown for, not to the other one', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const conversationId = await conversation(ctx)
        await openGate({ conversationId, gateId: 'gate-status', actionName: 'set_user_status' })
        await openGate({ conversationId, gateId: 'gate-message', actionName: 'send_channel_message' })

        await agentApprovalGate.resolveGate({ gateId: 'gate-status', approved: true })
        const decision = await agentApprovalGate.checkDecision({ gateId: 'gate-status' })

        expect(decision !== 'pending' && decision.approvedInput?.actionName).toBe('set_user_status')
        expect(await agentApprovalGate.checkDecision({ gateId: 'gate-message' })).toBe('pending')
    })
})
