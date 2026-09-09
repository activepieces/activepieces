import { AgentIcon, AgentRunSource, AIProviderName, apId, ColorName } from '@activepieces/shared'
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

async function createAgent(ctx: TestContext, displayName: string): Promise<string> {
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

async function conversationFor(ctx: TestContext, agentId: string): Promise<string> {
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

async function instructionsOf(agentId: string): Promise<string> {
    const [row] = await db.findBy<{ draft: { instructions: string } }>('agent', { id: agentId })
    return row.draft.instructions
}

describe('an agent asked to change its own instructions', () => {
    it('rewrites itself', async () => {
        const ctx = await contextWithAgents()
        const agentId = await createAgent(ctx, 'Ops agent')
        const conversationId = await conversationFor(ctx, agentId)

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
        const agentId = await createAgent(ctx, 'Ops agent')
        const otherAgentId = await createAgent(ctx, 'Finance agent')
        const conversationId = await conversationFor(ctx, agentId)

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

    it('is refused the tools that reach other agents entirely', async () => {
        const ctx = await contextWithAgents()
        const agentId = await createAgent(ctx, 'Ops agent')
        const conversationId = await conversationFor(ctx, agentId)

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
