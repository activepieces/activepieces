import { AIProviderName, apId, ErrorCode } from '@activepieces/core-utils'
import { AgentConversationStatus, AgentIcon, AgentRunSource, AgentToolType, ColorName, Flow, FlowStatus, FlowTriggerType, FlowVersion, FlowVersionState, McpPropertyType, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const originalJobQueue = jobQueueModule.jobQueue

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

describe('which version a conversation runs', () => {
    it('answers on what was saved, with nothing left to publish afterwards', async () => {
        const ctx = await context()
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)
        const agent = await createAgent(ctx, { modelName: CONFIGURED_MODEL, provider: AIProviderName.OPENROUTER })
        const cleared = await ctx.post(`/v1/agents/${agent.id}`, {
            draft: { ...agent.draft, provider: null, modelName: null },
        })
        expect(cleared.statusCode).toBe(StatusCodes.OK)
        expect(cleared.json().published.modelName).toBeNull()
        const conversation = await startConversation(ctx, agent.id)

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, {
            content: 'hello',
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('Pick a model')
    })
})

describe('the model an agent answers on', () => {
    it('refuses to run an agent that names no model, even when the platform has a chat provider', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)
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

describe('the flow tools a chat turn hands to the worker', () => {
    let addSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        addSpy = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({
            ...originalJobQueue(log),
            add: addSpy,
        }))
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('resolves a configured flow tool, the only shape the worker can run one from', async () => {
        const ctx = await context()
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)
        const { flow, flowVersion } = await seedMcpToolFlow(ctx)
        const agent = await createAgent(ctx, {
            provider: AIProviderName.OPENROUTER,
            modelName: CONFIGURED_MODEL,
            tools: [{ type: AgentToolType.FLOW, toolName: 'check_order_status', externalFlowId: flow.externalId }],
        })
        const conversation = await startConversation(ctx, agent.id)

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'Where is order 12345?' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const job = addSpy.mock.calls.map(([call]) => call).find((call) => call.data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)
        expect(job.data.flowTools).toEqual([{
            toolName: 'check_order_status',
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            description: TOOL_DESCRIPTION,
            inputSchema: expect.objectContaining({
                properties: expect.objectContaining({ orderNumber: expect.anything() }),
            }),
            returnsResponse: true,
        }])
    })

    it('refuses the turn when a configured flow tool names a flow this project does not have', async () => {
        const ctx = await context()
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)
        const agent = await createAgent(ctx, {
            provider: AIProviderName.OPENROUTER,
            modelName: CONFIGURED_MODEL,
            tools: [{ type: AgentToolType.FLOW, toolName: 'check_order_status', externalFlowId: apId() }],
        })
        const conversation = await startConversation(ctx, agent.id)

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'Where is order 12345?' })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('the referenced flow was not found in this project')
        expect(addSpy).not.toHaveBeenCalled()
    })

    it('refuses without taking the conversation over, so a reply already streaming survives', async () => {
        const ctx = await context()
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)
        const agent = await createAgent(ctx, {
            provider: AIProviderName.OPENROUTER,
            modelName: CONFIGURED_MODEL,
            tools: [{ type: AgentToolType.FLOW, toolName: 'check_order_status', externalFlowId: apId() }],
        })
        const conversation = await startConversation(ctx, agent.id)
        const streamingRunId = apId()
        await db.update('agent_conversation', conversation.id, {
            status: AgentConversationStatus.STREAMING,
            activeRunId: streamingRunId,
        })

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'Where is order 12345?' })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        const after = await agentHelpers.conversationRepo().findOneByOrFail({ id: conversation.id })
        expect(after.activeRunId).toBe(streamingRunId)
        expect(after.status).toBe(AgentConversationStatus.STREAMING)
    })

    it('cancels a run that started streaming while this turn was still being admitted', async () => {
        const ctx = await context()
        await enableForChat(ctx.platform.id, AIProviderName.OPENROUTER)
        const agent = await createAgent(ctx, { provider: AIProviderName.OPENROUTER, modelName: CONFIGURED_MODEL })
        const conversation = await startConversation(ctx, agent.id)

        const concurrentRunId = apId()
        const realGetUserProjects = agentHelpers.getUserProjects
        vi.spyOn(agentHelpers, 'getUserProjects').mockImplementation(async (args) => {
            await agentHelpers.conversationRepo().update(conversation.id, {
                activeRunId: concurrentRunId,
                status: AgentConversationStatus.STREAMING,
            })
            return realGetUserProjects(args)
        })

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'hello' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const after = await agentHelpers.conversationRepo().findOneByOrFail({ id: conversation.id })
        expect(after.activeRunId).not.toBe(concurrentRunId)
        expect(after.status).toBe(AgentConversationStatus.IDLE)
    })
})

async function seedMcpToolFlow(ctx: TestContext): Promise<{ flow: Flow, flowVersion: FlowVersion }> {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.ENABLED })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: FlowVersionState.LOCKED,
        valid: true,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            displayName: 'MCP Tool',
            valid: true,
            lastUpdatedDate: new Date().toISOString(),
            settings: {
                pieceName: '@activepieces/piece-mcp',
                pieceVersion: '0.0.21',
                triggerName: 'mcp_tool',
                propertySettings: {},
                input: {
                    toolName: 'check_order_status',
                    toolDescription: TOOL_DESCRIPTION,
                    inputSchema: [{ name: 'orderNumber', type: McpPropertyType.TEXT, required: true, description: 'The order number' }],
                    returnsResponse: true,
                },
            },
        },
    })
    await db.save('flow_version', flowVersion)
    await db.update('flow', flow.id, { publishedVersionId: flowVersion.id })
    return { flow, flowVersion }
}

const TOOL_DESCRIPTION = 'Look up the delivery status of a customer order.'
