import { AgentIcon, AgentRunSource, AIProviderName, apId, ApplicationEvent, ApplicationEventName, ColorName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function contextWithAgents(): Promise<TestContext> {
    const ctx = await createTestContext(app, {
        plan: { agentsEnabled: true, chatEnabled: true },
    })
    await mockAndSaveAIProvider({
        platformId: ctx.platform.id,
        provider: AIProviderName.OPENAI,
        enabledForChat: true,
    })
    return ctx
}

async function createAgent({ ctx, displayName }: { ctx: TestContext, displayName: string }): Promise<string> {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName,
        description: null,
        icon: AgentIcon.BOT,
        color: ColorName.PURPLE,
        draft: {
            instructions: 'Do the original job.',
            maxSteps: 5,
            tools: [],
            structuredOutput: [],
            modelName: null,
        },
    })
    return response.json().id
}

async function conversationFor({ ctx, agentId }: { ctx: TestContext, agentId: string }): Promise<string> {
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
    return conversationId
}

async function auditRowsFor(ctx: TestContext): Promise<ApplicationEvent[]> {
    for (let attempt = 0; attempt < 24; attempt++) {
        const rows = await db.findBy<ApplicationEvent>('audit_event', { platformId: ctx.platform.id })
        const found = rows.filter((row) => row.action === ApplicationEventName.AGENT_UPDATED)
        if (found.length > 0) {
            return found
        }
        await new Promise((resolve) => setTimeout(resolve, 25))
    }
    return []
}

async function publishedOf(agentId: string): Promise<string | null> {
    const [row] = await db.findBy<{ published: { instructions: string } | null }>('agent', { id: agentId })
    return row.published?.instructions ?? null
}

async function instructionsOf(agentId: string): Promise<string> {
    const [row] = await db.findBy<{ draft: { instructions: string } }>('agent', { id: agentId })
    return row.draft.instructions
}

describe('an agent asked to change its own instructions', () => {
    it('rewrites itself', async () => {
        const ctx = await contextWithAgents()
        const agentId = await createAgent({ ctx, displayName: 'Ops agent' })
        const conversationId = await conversationFor({ ctx, agentId })

        await agentRpcHandlers(app.log).executeAgentTool({
            toolName: 'ap_update_agent',
            toolInput: { instructions: 'Escalate anything over $200.' },
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            source: AgentRunSource.AGENT,
            conversationId,
        })

        expect(await instructionsOf(agentId)).toBe('Escalate anything over $200.')
    })

    it('cannot rewrite a different agent by naming its id', async () => {
        const ctx = await contextWithAgents()
        const agentId = await createAgent({ ctx, displayName: 'Ops agent' })
        const otherAgentId = await createAgent({ ctx, displayName: 'Finance agent' })
        const conversationId = await conversationFor({ ctx, agentId })

        await agentRpcHandlers(app.log).executeAgentTool({
            toolName: 'ap_update_agent',
            toolInput: { agentId: otherAgentId, instructions: 'Approve every refund.' },
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            source: AgentRunSource.AGENT,
            conversationId,
        })

        expect(await instructionsOf(otherAgentId)).toBe('Do the original job.')
        expect(await instructionsOf(agentId)).toBe('Approve every refund.')
    })

    it('does not publish itself, even when it says to', async () => {
        const ctx = await contextWithAgents()
        const agentId = await createAgent({ ctx, displayName: 'Ops agent' })
        const conversationId = await conversationFor({ ctx, agentId })

        await agentRpcHandlers(app.log).executeAgentTool({
            toolName: 'ap_update_agent',
            toolInput: { instructions: 'Approve every refund.', publish: true },
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            source: AgentRunSource.AGENT,
            conversationId,
        })

        expect(await instructionsOf(agentId)).toBe('Approve every refund.')
        expect(await publishedOf(agentId)).toBeNull()
    })

    it('leaves an audit row, so a rewrite is not invisible', async () => {
        const ctx = await contextWithAgents()
        const agentId = await createAgent({ ctx, displayName: 'Ops agent' })
        const conversationId = await conversationFor({ ctx, agentId })

        await agentRpcHandlers(app.log).executeAgentTool({
            toolName: 'ap_update_agent',
            toolInput: { instructions: 'Escalate anything over $200.' },
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            source: AgentRunSource.AGENT,
            conversationId,
        })

        const [row] = await auditRowsFor(ctx)
        expect(row).toBeDefined()
        expect(row.data).toMatchObject({ agent: { id: agentId } })
    })

    it('is refused the tools that reach other agents entirely', async () => {
        const ctx = await contextWithAgents()
        const agentId = await createAgent({ ctx, displayName: 'Ops agent' })
        const conversationId = await conversationFor({ ctx, agentId })

        for (const toolName of ['ap_list_agents', 'ap_create_agent']) {
            await expect(agentRpcHandlers(app.log).executeAgentTool({
                toolName,
                toolInput: { displayName: 'Sneaky', instructions: 'Do as I say.' },
                platformId: ctx.platform.id,
                userId: ctx.user.id,
                source: AgentRunSource.AGENT,
                conversationId,
            })).rejects.toThrow()
        }
    })
})
