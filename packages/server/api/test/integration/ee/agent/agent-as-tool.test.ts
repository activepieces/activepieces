import { AIProviderName, apId } from '@activepieces/core-utils'
import { AgentIcon, AgentToolType, AgentVisibility, ColorName, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { accessTokenManager } from '../../../../src/app/authentication/lib/access-token-manager'
import { agentToolsRollout } from '../../../../src/app/ee/agent/agent-tools-rollout'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const originalJobQueue = jobQueueModule.jobQueue
const CONFIGURED_MODEL = 'anthropic/claude-haiku-4.5'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    vi.spyOn(agentToolsRollout, 'isOn').mockReturnValue(true)
})

afterEach(() => {
    vi.restoreAllMocks()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
}

async function createAgent(ctx: TestContext, { displayName, description, tools = [] }: { displayName: string, description?: string, tools?: unknown[] }) {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName,
        ...(description ? { description } : {}),
        icon: AgentIcon.MAIL,
        color: ColorName.BLUE,
        draft: { instructions: 'Do the task.', provider: AIProviderName.OPENROUTER, modelName: CONFIGURED_MODEL, maxSteps: 5, tools, structuredOutput: [] },
    })
    return response
}

async function createPublishedAgent(ctx: TestContext, params: { displayName: string, description?: string, tools?: unknown[] }) {
    const created = await createAgent(ctx, params)
    expect(created.statusCode).toBe(StatusCodes.CREATED)
    const published = await ctx.post(`/v1/agents/${created.json().id}/publish`, {})
    expect(published.statusCode).toBe(StatusCodes.OK)
    return published.json()
}

function agentTool({ externalAgentId, toolName = 'ask_researcher' }: { externalAgentId: string, toolName?: string }) {
    return { type: AgentToolType.AGENT, toolName, externalAgentId }
}

describe('saving an agent that calls another agent', () => {
    it('saves a published agent from the same project as a tool', async () => {
        const ctx = await context()
        const researcher = await createPublishedAgent(ctx, { displayName: 'Researcher' })

        const response = await createAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: researcher.externalId })] })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(response.json().draft.tools).toEqual([agentTool({ externalAgentId: researcher.externalId })])
    })

    it('refuses an agent that is not published yet', async () => {
        const ctx = await context()
        const draftOnly = await createAgent(ctx, { displayName: 'Draft only' })

        const response = await createAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: draftOnly.json().externalId })] })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('Publish "Draft only"')
    })

    it('refuses an agent from another project', async () => {
        const ctx = await context()
        const other = await context()
        const elsewhere = await createPublishedAgent(other, { displayName: 'Elsewhere' })

        const response = await createAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: elsewhere.externalId })] })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('was not found in this project')
    })

    it('refuses an agent that already calls other agents, so calls nest one level only', async () => {
        const ctx = await context()
        const researcher = await createPublishedAgent(ctx, { displayName: 'Researcher' })
        const lead = await createPublishedAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: researcher.externalId })] })

        const response = await createAgent(ctx, { displayName: 'Boss', tools: [agentTool({ externalAgentId: lead.externalId, toolName: 'ask_lead' })] })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('one level deep')
    })

    it('refuses giving agent tools to an agent another agent already calls', async () => {
        const ctx = await context()
        const researcher = await createPublishedAgent(ctx, { displayName: 'Researcher' })
        await createPublishedAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: researcher.externalId })] })
        const helper = await createPublishedAgent(ctx, { displayName: 'Helper' })

        const response = await ctx.post(`/v1/agents/${researcher.id}`, {
            draft: { ...researcher.draft, tools: [agentTool({ externalAgentId: helper.externalId, toolName: 'ask_helper' })] },
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('already used as a tool')
    })

    it('refuses an agent calling itself', async () => {
        const ctx = await context()
        const agent = await createPublishedAgent(ctx, { displayName: 'Loop' })

        const response = await ctx.post(`/v1/agents/${agent.id}`, {
            draft: { ...agent.draft, tools: [agentTool({ externalAgentId: agent.externalId })] },
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('cannot use itself')
    })

    it('refuses a restricted agent, so its description never reaches someone else', async () => {
        const ctx = await context()
        const secret = await createPublishedAgent(ctx, { displayName: 'Secret', description: 'Knows the salaries.' })
        await db.update('agent', secret.id, { visibility: AgentVisibility.RESTRICTED })

        const response = await createAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: secret.externalId })] })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('was not found in this project')
    })

    it('refuses agent tools while the rollout is off', async () => {
        vi.spyOn(agentToolsRollout, 'isOn').mockReturnValue(false)
        const ctx = await context()
        const researcher = await createPublishedAgent(ctx, { displayName: 'Researcher' })

        const response = await createAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: researcher.externalId })] })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('not available yet')
    })
})

describe('the agent tools a chat turn hands to the worker', () => {
    let addSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        addSpy = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({
            ...originalJobQueue(log),
            add: addSpy,
        }))
    })

    async function sendMessage(ctx: TestContext, agentId: string) {
        const saved = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER })
        await db.update('ai_provider', saved.id, { enabledForChat: true })
        const conversation = await ctx.post('/v1/agents/conversations', { agentId })
        expect(conversation.statusCode).toBe(StatusCodes.CREATED)
        const response = await ctx.post(`/v1/agents/conversations/${conversation.json().id}/messages`, { content: 'Find three competitors.' })
        expect(response.statusCode).toBe(StatusCodes.OK)
        return addSpy.mock.calls.map(([call]) => call).find((call) => call.data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)
    }

    it('names the tool after the called agent and describes it with that agent description', async () => {
        const ctx = await context()
        const researcher = await createPublishedAgent(ctx, { displayName: 'Researcher', description: 'Researches companies on the web.' })
        const lead = await createPublishedAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: researcher.externalId })] })

        const job = await sendMessage(ctx, lead.id)

        expect(job.data.agentTools).toEqual([{ toolName: 'ask_researcher', agentId: researcher.id, description: 'Researches companies on the web.' }])
    })

    it('skips an agent that was made restricted after it was added', async () => {
        const ctx = await context()
        const researcher = await createPublishedAgent(ctx, { displayName: 'Researcher', description: 'Knows the salaries.' })
        const lead = await createPublishedAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: researcher.externalId })] })
        await db.update('agent', researcher.id, { visibility: AgentVisibility.RESTRICTED })

        const job = await sendMessage(ctx, lead.id)

        expect(job.data.agentTools).toEqual([])
    })

    it('keeps a flow step running when the agent behind its agent tool was deleted', async () => {
        const ctx = await context()
        const researcher = await createPublishedAgent(ctx, { displayName: 'Researcher' })
        await ctx.delete(`/v1/agents/${researcher.id}`)
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER, enabledForChat: true })
        const engineToken = await accessTokenManager(app.log).generateEngineToken({ jobId: apId(), projectId: ctx.project.id, platformId: ctx.platform.id })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/agents/runs',
            headers: { authorization: `Bearer ${engineToken}` },
            body: {
                instruction: 'Find three competitors.',
                flowRunId: apId(),
                waitpointId: apId(),
                modelName: CONFIGURED_MODEL,
                provider: AIProviderName.OPENROUTER,
                tools: [agentTool({ externalAgentId: researcher.externalId })],
            },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const job = addSpy.mock.calls.map(([call]) => call).find((call) => call.data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)
        expect(job.data.agentTools).toEqual([])
    })

    it('skips an agent tool whose agent was deleted, instead of failing the turn', async () => {
        const ctx = await context()
        const researcher = await createPublishedAgent(ctx, { displayName: 'Researcher' })
        const lead = await createPublishedAgent(ctx, { displayName: 'Lead', tools: [agentTool({ externalAgentId: researcher.externalId })] })
        const deleted = await ctx.delete(`/v1/agents/${researcher.id}`)
        expect(deleted.statusCode).toBeLessThan(300)

        const job = await sendMessage(ctx, lead.id)

        expect(job.data.agentTools).toEqual([])
    })
})
