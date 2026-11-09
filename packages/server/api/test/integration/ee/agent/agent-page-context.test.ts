import { AIProviderName } from '@activepieces/core-utils'
import { AgentConversation, ExecuteAgentRunJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, afterEach, beforeAll, describe, expect, it, Mock, vi } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockProject, mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const originalJobQueue = jobQueueModule.jobQueue

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('page context on a chat message', () => {
    it('reaches the turn\'s model input once, is never stored, and is ignored for another project', async () => {
        const { ctx, tierId, add } = await chatSetup()
        const conversation = await startChat({ ctx, body: { modelTierId: tierId, projectId: ctx.project.id } })
        const pageContext = { kind: 'flow', id: 'flow-1', projectId: ctx.project.id, stepName: 'step_1' }

        const foreign = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'hello', pageContext: { ...pageContext, projectId: 'other-project' } })
        const own = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'hello', pageContext })
        const [foreignJob, ownJob] = queuedRuns({ add })
        const config = await configFor({ ctx, conversation, job: ownJob })
        const stored = await db.findOneByOrFail<AgentConversation>('agent_conversation', { id: conversation.id })

        expect([foreign.statusCode, own.statusCode]).toEqual([StatusCodes.OK, StatusCodes.OK])
        expect(foreignJob.pageContext).toBeUndefined()
        expect(ownJob.pageContext).toEqual(pageContext)
        expect(config.messages.at(-1)).toEqual({ role: 'user', content: [{ type: 'text', text: `[Page context] The user is looking at flow flow-1 in project ${ctx.project.id}, step "step_1" selected.` }, { type: 'text', text: 'hello' }] })
        expect(JSON.stringify([stored.messages, stored.uiMessages, config.allMessages])).not.toContain('[Page context]')
    })

    it('is kept on the first message of a chat with no project when it names the project the run will use', async () => {
        const { ctx, tierId, add } = await chatSetup()
        const conversation = await startChat({ ctx, body: { modelTierId: tierId } })
        const pageContext = { kind: 'table', id: 'table-1', projectId: ctx.project.id }

        const response = await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'hello', pageContext })

        expect(conversation.projectId ?? null).toBeNull()
        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(queuedRuns({ add })[0].pageContext).toEqual(pageContext)
    })
})

describe('a new chat started from a project page', () => {
    it('runs in the tab\'s project, not the user\'s first one', async () => {
        const { ctx, tierId, add } = await chatSetup()
        const projectB = createMockProject({ ownerId: ctx.user.id, platformId: ctx.platform.id })
        await db.save('project', projectB)
        const conversation = await startChat({ ctx, body: { modelTierId: tierId, projectId: projectB.id } })
        const pageContext = { kind: 'flow', id: 'flow-b', projectId: projectB.id }

        await ctx.post(`${CONVERSATIONS_URL}/${conversation.id}/messages`, { content: 'hello', pageContext })
        const [job] = queuedRuns({ add })
        const config = await configFor({ ctx, conversation, job })

        expect(conversation.projectId).toBe(projectB.id)
        expect(job).toMatchObject({ projectId: projectB.id, pageContext })
        expect(config.projectId).toBe(projectB.id)
    })

    it('is refused for a project the user cannot reach', async () => {
        const { ctx, tierId } = await chatSetup()
        const outsider = await createTestContext(app)

        const response = await ctx.post(CONVERSATIONS_URL, { modelTierId: tierId, projectId: outsider.project.id })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})

async function chatSetup(): Promise<{ ctx: TestContext, tierId: string, add: Mock }> {
    const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, aiProvidersEnabled: true } })
    const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
    const tier = (await ctx.post('/v1/platform-model-tiers', { name: 'Expert', emoji: '🧠', description: null, entries: [{ configId: key.id, modelId: 'gpt-4o' }] })).json()
    const add = vi.fn()
    vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({ ...originalJobQueue(log), add }))
    return { ctx, tierId: tier.id, add }
}

async function startChat({ ctx, body }: { ctx: TestContext, body: Record<string, unknown> }): Promise<AgentConversation> {
    const response = await ctx.post(CONVERSATIONS_URL, body)
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function configFor({ ctx, conversation, job }: { ctx: TestContext, conversation: AgentConversation, job: ExecuteAgentRunJobData }): ReturnType<ReturnType<typeof agentRpcHandlers>['getAgentConfig']> {
    await db.update('agent_conversation', conversation.id, { status: 'IDLE', activeRunId: null })
    return agentRpcHandlers(app.log).getAgentConfig({ conversationId: conversation.id, platformId: ctx.platform.id, userId: ctx.user.id, userMessage: 'hello', modelName: null, dryRun: true, pageContext: job.pageContext })
}

function queuedRuns({ add }: { add: Mock }): ExecuteAgentRunJobData[] {
    return add.mock.calls.map(([call]) => call.data).filter((data) => data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)
}

const CONVERSATIONS_URL = '/v1/agents/conversations'
