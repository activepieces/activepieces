import { AgentIcon, AgentRunSource, AIProviderName, apId, ApplicationEventName, ColorName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { pieceToolRunner } from '../../../../src/app/ee/agent/tools/piece-tool-runner'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    process.env.AP_AGENTS_ENABLED = 'true'
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

async function agentThatRuns(ctx: TestContext): Promise<{ conversationId: string, agentId: string }> {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Ops agent',
        description: null,
        icon: AgentIcon.BOT,
        color: ColorName.PURPLE,
        draft: { instructions: 'Do the ops work.', maxSteps: 5, tools: [], structuredOutput: [], modelName: null },
    })
    const agentId = response.json().id
    const conversationId = apId()
    await db.save('agent_conversation', {
        id: conversationId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: ctx.platform.id,
        projectId: ctx.project.id,
        userId: ctx.user.id,
        agentId,
        source: AgentRunSource.AGENT,
        status: 'STREAMING',
        messages: [],
        uiMessages: [],
    })
    return { conversationId, agentId }
}

function stubTheRun(): void {
    vi.spyOn(pieceToolRunner, 'resolveInput').mockResolvedValue({ resolvedInput: { to: 'someone@example.com' }, actionDisplayName: 'Send Email' } as never)
    vi.spyOn(pieceToolRunner, 'runResolved').mockResolvedValue({ result: { success: true }, resolvedInput: { to: 'someone@example.com' } } as never)
}

async function auditRowsFor(ctx: TestContext): Promise<{ action: string, data: Record<string, unknown> }[]> {
    for (let attempt = 0; attempt < 20; attempt++) {
        const rows = await db.findBy<{ action: string, data: Record<string, unknown> }>('audit_event', { platformId: ctx.platform.id })
        const agentRows = rows.filter((row) => row.action === ApplicationEventName.AGENT_ACTION_EXECUTED)
        if (agentRows.length > 0) {
            return agentRows
        }
        await new Promise((resolve) => setTimeout(resolve, 25))
    }
    return []
}

async function runAction(ctx: TestContext, conversationId: string, actionName: string) {
    return agentRpcHandlers(app.log).executePieceTool({
        conversationId,
        toolName: `gmail-${actionName}`,
        instruction: 'do the thing',
        piece: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.9.0', actionName },
    })
}

describe('an action an agent ran reaches the audit log', () => {
    // The receipt for a configured action lives in the conversation that ran it, which nobody
    // outside that conversation can find. A platform admin looks in the audit log instead.
    it('records a write, naming the agent, the action and the account it used', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, auditLogEnabled: true } })
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const { conversationId, agentId } = await agentThatRuns(ctx)
        stubTheRun()

        await runAction(ctx, conversationId, 'send_email')

        const [row] = await auditRowsFor(ctx)
        expect(row).toBeDefined()
        expect(JSON.stringify(row.data)).toContain('send_email')
        expect(JSON.stringify(row.data)).toContain(agentId)
        expect(JSON.stringify(row.data)).toContain('Ops agent')
    })

    // Reading is not a change, and logging every read would bury the writes that matter.
    it('leaves a read out of it', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, auditLogEnabled: true } })
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const { conversationId } = await agentThatRuns(ctx)
        stubTheRun()

        await runAction(ctx, conversationId, 'search_mail')

        expect(await auditRowsFor(ctx)).toHaveLength(0)
    })

    // custom_api_call carries no verb, so the method decides. An unknown method is a write.
    it('records a raw API call whose method is not provably safe', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, auditLogEnabled: true } })
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        const { conversationId } = await agentThatRuns(ctx)
        vi.spyOn(pieceToolRunner, 'resolveInput').mockResolvedValue({ resolvedInput: { method: 'POST' }, actionDisplayName: 'Custom API Call' } as never)
        vi.spyOn(pieceToolRunner, 'runResolved').mockResolvedValue({ result: { success: true }, resolvedInput: { method: 'POST' } } as never)

        await runAction(ctx, conversationId, 'custom_api_call')

        expect(await auditRowsFor(ctx)).toHaveLength(1)
    })
})
