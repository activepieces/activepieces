import { AIProviderName, ErrorCode } from '@activepieces/core-utils'
import { AgentIcon, AgentRunSource, ColorName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const CONVERSATIONS_URL = '/v1/agents/conversations'
const CONFIGURED_MODEL = 'anthropic/claude-haiku-4.5'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
}

async function createAgent(ctx: TestContext, draft: Record<string, unknown> = {}) {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Email organizer',
        icon: AgentIcon.MAIL,
        color: ColorName.BLUE,
        draft: {
            instructions: 'Sort unread mail.',
            provider: null,
            modelName: null,
            maxSteps: 5,
            tools: [],
            structuredOutput: [],
            ...draft,
        },
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function startConversation(ctx: TestContext, agentId: string) {
    const response = await ctx.post(CONVERSATIONS_URL, { agentId })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function enableForChat(platformId: string, provider: AIProviderName) {
    const saved = await mockAndSaveAIProvider({ platformId, provider })
    await db.update('ai_provider', saved.id, { enabledForChat: true })
    return saved
}

describe('an agent conversation', () => {
    it('belongs to the agent and to the agent project, not to chat', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const conversation = await startConversation(ctx, agent.id)

        expect(conversation.agentId).toBe(agent.id)
        expect(conversation.source).toBe(AgentRunSource.AGENT)
        expect(conversation.projectId).toBe(ctx.project.id)
    })

    it('stays out of the chat list and lists under its own agent', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        const conversation = await startConversation(ctx, agent.id)

        const chatList = await ctx.get(CONVERSATIONS_URL)
        expect(chatList.statusCode).toBe(StatusCodes.OK)
        const chatIds = chatList.json().data.map((row: { id: string }) => row.id)
        expect(chatIds).not.toContain(conversation.id)

        const agentList = await ctx.get(CONVERSATIONS_URL, { agentId: agent.id })
        expect(agentList.statusCode).toBe(StatusCodes.OK)
        const agentIds = agentList.json().data.map((row: { id: string }) => row.id)
        expect(agentIds).toEqual([conversation.id])
    })

    it('cannot be started against an agent in a project the caller cannot read', async () => {
        const owner = await context()
        const agent = await createAgent(owner)
        const stranger = await context()

        const response = await stranger.post(CONVERSATIONS_URL, { agentId: agent.id })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})

describe('the model an agent answers on', () => {
    it('refuses to run an agent that names no model, even when the platform has a chat provider', async () => {
        const ctx = await context()
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)
        const agent = await createAgent(ctx, { provider: null, modelName: null })
        const conversation = await startConversation(ctx, agent.id)

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, {
            content: 'Sort my inbox',
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().code).toBe(ErrorCode.VALIDATION)
        expect(response.json().params.message).toBe('Pick a model for this agent before talking to it')
    })

    it('accepts an agent that names its own model and provider', async () => {
        const ctx = await context()
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)
        const agent = await createAgent(ctx, {
            provider: AIProviderName.OPENROUTER,
            modelName: CONFIGURED_MODEL,
        })
        const conversation = await startConversation(ctx, agent.id)

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, {
            content: 'Sort my inbox',
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('names a model the chat tier resolver would not have chosen', async () => {
        // The tier resolver returns the default tier for anything it does not recognise as a tier
        // id, so routing a concrete model id through it comes back as a different model with no
        // error. The two must differ for the accepting test above to mean anything.
        const chatDefault = agentHelpers.resolveTier({ tierId: null }).modelId

        expect(CONFIGURED_MODEL).not.toBe(chatDefault)
    })

    it('runs a chat conversation on the platform chat provider, unchanged', async () => {
        const ctx = await context()
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)

        const conversation = await ctx.post(CONVERSATIONS_URL, {})
        expect(conversation.statusCode).toBe(StatusCodes.CREATED)
        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.json().id}/messages`, {
            content: 'hello',
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })
})
