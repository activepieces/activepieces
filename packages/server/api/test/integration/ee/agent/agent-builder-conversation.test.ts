import { AIProviderName } from '@activepieces/core-utils'
import { AgentIcon, AgentRunSource, DEFAULT_CHAT_TIER_ID, ColorName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { agentPrompt } from '../../../../src/app/ee/agent/prompt/agent-prompt'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const CONVERSATIONS_URL = '/v1/agents/conversations'

beforeAll(async () => {
    process.env.AP_AGENTS_ENABLED = 'true'
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
}

async function createAgent(ctx: TestContext) {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Inbox triage',
        description: 'Sorts unread mail.',
        icon: AgentIcon.MAIL,
        color: ColorName.BLUE,
        draft: { instructions: 'Sort unread mail.', provider: null, providerConfigId: null, modelName: null, maxSteps: 5, tools: [], structuredOutput: [] },
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

describe('starting a builder conversation', () => {
    it('takes the project from the agent it is going to change', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const response = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id, builder: true })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(response.json().source).toBe(AgentRunSource.AGENT_BUILDER)
        expect(response.json().projectId).toBe(ctx.project.id)
        expect(response.json().agentId).toBe(agent.id)
    })

    it('starts a fresh thread each time, so reopening does not resume an old edit session', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const first = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id, builder: true })
        const second = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id, builder: true })

        expect(first.statusCode).toBe(StatusCodes.CREATED)
        expect(second.statusCode).toBe(StatusCodes.CREATED)
        expect(second.json().id).not.toBe(first.json().id)
    })

    it('keeps the builder threads out of the agent conversation list', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(CONVERSATIONS_URL, { agentId: agent.id, builder: true })

        const listed = await ctx.get(`${CONVERSATIONS_URL}?agentId=${agent.id}&limit=20`)

        expect(listed.statusCode).toBe(StatusCodes.OK)
        expect(listed.json().data).toEqual([])
    })

    it('builds a new agent in a project the caller names', async () => {
        const ctx = await context()

        const response = await ctx.post(CONVERSATIONS_URL, { builder: true, projectId: ctx.project.id })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(response.json().source).toBe(AgentRunSource.AGENT_BUILDER)
        expect(response.json().projectId).toBe(ctx.project.id)
        expect(response.json().agentId).toBeNull()
    })

    it('refuses a builder with nothing to build and nowhere to build it', async () => {
        const ctx = await context()

        const response = await ctx.post(CONVERSATIONS_URL, { builder: true })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('agentId')
    })

    it('refuses a project the caller cannot reach', async () => {
        const stranger = await context()
        const owner = await context()

        const response = await stranger.post(CONVERSATIONS_URL, { builder: true, projectId: owner.project.id })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('leaves an ordinary agent conversation on the agent source', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const response = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id })

        expect(response.json().source).toBe(AgentRunSource.AGENT)
    })

    it('stays out of the chat list and out of the agent history', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        const builder = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id, builder: true })
        const builderId = builder.json().id

        const chatList = await ctx.get(CONVERSATIONS_URL)
        const agentList = await ctx.get(CONVERSATIONS_URL, { agentId: agent.id })

        expect(chatList.json().data.map((row: { id: string }) => row.id)).not.toContain(builderId)
        expect(agentList.json().data.map((row: { id: string }) => row.id)).not.toContain(builderId)
    })
})

describe('whose model a builder run answers on', () => {
    // An agent that names no model cannot be talked to, and that is the point of the guard. The
    // builder is not that agent: refusing it here would leave a half-made agent unbuildable, which
    // is exactly the state the builder exists to get you out of.
    it('builds an agent that names no model, where talking to that agent is refused', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER, enabledForChat: true })

        const asAgent = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id })
        const refused = await ctx.post(`${CONVERSATIONS_URL}/${asAgent.json().id}/messages`, { content: 'hello' })

        const asBuilder = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id, builder: true })
        const accepted = await ctx.post(`${CONVERSATIONS_URL}/${asBuilder.json().id}/messages`, { content: 'give it a gmail tool' })

        expect(refused.statusCode).toBe(StatusCodes.CONFLICT)
        expect(refused.json().params.message).toContain('Pick a model')
        expect(accepted.statusCode).toBe(StatusCodes.OK)
    })
})

describe('what the builder can actually reach at run time', () => {
    // The worker lists ap_research_pieces and ap_list_connections for the builder, and those come
    // from the project MCP set, which only exists when the run carries MCP credentials. The tool
    // policy test cannot see this: it hand-builds the group. So assert the config the worker is
    // handed, which is where the tools either exist or silently do not.
    it('is handed the mcp credentials its piece lookup depends on', async () => {
        const ctx = await context()
        const saved = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER })
        await db.update('ai_provider', saved.id, { enabledForChat: true })
        const agent = await createAgent(ctx)
        const conversation = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id, builder: true })

        const config = await agentRpcHandlers(app.log).getAgentConfig({
            conversationId: conversation.json().id,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            userMessage: 'give it a gmail tool',
            modelName: null,
            source: AgentRunSource.AGENT_BUILDER,
        })

        expect(config.mcpCredentials).not.toBeNull()
        expect(config.agentsAvailable).toBe(true)
    })

    it('resolves the tier it inherits from chat, rather than sending it to the provider', async () => {
        const ctx = await context()
        const saved = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER })
        await db.update('ai_provider', saved.id, { enabledForChat: true })
        const agent = await createAgent(ctx)
        const conversation = await ctx.post(CONVERSATIONS_URL, { agentId: agent.id, builder: true, modelName: DEFAULT_CHAT_TIER_ID })

        const config = await agentRpcHandlers(app.log).getAgentConfig({
            conversationId: conversation.json().id,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            userMessage: 'give it a gmail tool',
            modelName: DEFAULT_CHAT_TIER_ID,
            source: AgentRunSource.AGENT_BUILDER,
        })

        expect(config.modelId).not.toBe(DEFAULT_CHAT_TIER_ID)
        expect(config.modelId).toBe('anthropic/claude-sonnet-4.6')
    })
})

describe('what the builder is told', () => {
    it('is told the agent it is looking at, so the first turn does not spend a call finding out', () => {
        const prompt = agentPrompt.buildBuilderSystemPrompt({
            agent: {
                id: 'agent-1',
                displayName: 'Inbox triage',
                description: 'Sorts unread mail.',
                draft: { instructions: 'Sort unread mail.', tools: [] },
                published: null,
            } as never,
        })

        expect(prompt).toContain('Inbox triage')
        expect(prompt).toContain('Sort unread mail.')
        expect(prompt).toContain('Tools: none')
        expect(prompt).toContain('Save and go live')
        expect(prompt).not.toContain('until it is published')
    })

    it('says there is no agent yet when it is starting one', () => {
        const prompt = agentPrompt.buildBuilderSystemPrompt({ agent: null })

        expect(prompt).toContain('No agent yet')
    })

    it('never tells the builder to answer as the agent', () => {
        const prompt = agentPrompt.buildBuilderSystemPrompt({ agent: null })

        expect(prompt).toContain('You are not that agent')
        expect(prompt).toContain('Test tab')
    })
})
