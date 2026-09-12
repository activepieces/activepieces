import { AIProviderName, apId } from '@activepieces/core-utils'
import { AgentIcon, AgentRunSource, AgentToolType, AgentVisibility, ColorName, DefaultProjectRole, FlowActionType, FlowTriggerType, McpAuthType, McpProtocol, PauseType, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { accessTokenManager } from '../../../../src/app/authentication/lib/access-token-manager'
import { WaitpointStatus } from '../../../../src/app/waitpoints/waitpoint-types'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const RUNS_URL = '/api/v1/agents/runs'

let app: FastifyInstance

const originalJobQueue = jobQueueModule.jobQueue

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
    await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
    return ctx
}

async function createAgent(ctx: TestContext, draft: Record<string, unknown> = {}) {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Inbox agent',
        icon: AgentIcon.SPARKLES,
        color: ColorName.PURPLE,
        draft: {
            instructions: 'Sort the inbox.',
            provider: AIProviderName.OPENAI,
            modelName: 'gpt-5',
            maxSteps: 7,
            tools: [],
            structuredOutput: [],
            ...draft,
        },
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

const AGENT_STEP_NAME = 'step_1'

function agentStep({ name, agentId, nextAction }: { name: string, agentId?: string, nextAction?: unknown }) {
    return {
        name,
        type: FlowActionType.PIECE,
        valid: true,
        displayName: 'Ask an agent',
        settings: {
            input: { agentId, prompt: 'clear my inbox' },
            pieceName: '@activepieces/piece-ai',
            pieceVersion: '0.7.0',
            actionName: 'run_agent',
            propertySettings: {},
        },
        nextAction,
    }
}

async function flowRunNaming({ ctx, agentIds, siblingAgentId, stepIsAgentPiece = true, publish = false, siblingSharesName = false }: { ctx: TestContext, agentIds: string[], siblingAgentId?: string, stepIsAgentPiece?: boolean, publish?: boolean, siblingSharesName?: boolean }): Promise<{ flowRunId: string, waitpointId: string }> {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const version = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        agentIds,
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.EMPTY,
            valid: true,
            displayName: 'Select Trigger',
            settings: {},
            nextAction: stepIsAgentPiece
                ? agentStep({
                    name: AGENT_STEP_NAME,
                    agentId: agentIds[0],
                    nextAction: siblingAgentId ? agentStep({ name: siblingSharesName ? AGENT_STEP_NAME : 'step_2', agentId: siblingAgentId }) : undefined,
                })
                : {
                    name: AGENT_STEP_NAME,
                    type: FlowActionType.CODE,
                    valid: true,
                    displayName: 'Code',
                    settings: { input: { agentId: agentIds[0] }, sourceCode: { code: '', packageJson: '' } },
                },
        } as never,
    })
    await db.save('flow_version', version)
    if (publish) {
        await db.update('flow', flow.id, { publishedVersionId: version.id })
    }
    const flowRun = createMockFlowRun({ projectId: ctx.project.id, flowId: flow.id, flowVersionId: version.id })
    await db.save('flow_run', flowRun)
    const waitpoint = {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        flowRunId: flowRun.id,
        projectId: ctx.project.id,
        type: PauseType.WEBHOOK,
        status: WaitpointStatus.PENDING,
        version: 'V1',
        stepName: AGENT_STEP_NAME,
    }
    await db.save('waitpoint', waitpoint)
    return { flowRunId: flowRun.id, waitpointId: waitpoint.id }
}

async function startRun(ctx: TestContext, body: Record<string, unknown>, boundTo?: { flowRunId: string, waitpointId: string }) {
    const engineToken = await accessTokenManager(app.log).generateEngineToken({
        jobId: apId(),
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
    })
    const bound = boundTo ?? (typeof body.agentId === 'string'
        ? await flowRunNaming({ ctx, agentIds: [body.agentId] })
        : { flowRunId: apId(), waitpointId: apId() })
    return app.inject({
        method: 'POST',
        url: RUNS_URL,
        headers: { authorization: `Bearer ${engineToken}` },
        body: { instruction: 'clear my inbox', ...bound, ...body },
    })
}

describe('a flow step that links a saved agent', () => {
    it('runs the published agent, not the draft the owner is still editing', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)
        // The draft now names a provider this platform does not have, so a resolver reading the
        // draft would fail to find it while the published copy still runs. Written straight to the
        // row because saving through the API publishes, which would move the copy under the test.
        await db.update('agent', agent.id, { draft: { ...agent.draft, provider: AIProviderName.ANTHROPIC, modelName: 'claude-x' } })

        const response = await startRun(ctx, { agentId: agent.externalId })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('says to publish it first, rather than running nothing', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const response = await startRun(ctx, { agentId: agent.externalId })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('Publish')
    })

    it('refuses an agent from another project, even with a real external id', async () => {
        const mine = await context()
        const theirs = await context()
        const theirAgent = await createAgent(theirs)
        await theirs.post(`/v1/agents/${theirAgent.id}/publish`)

        const response = await startRun(mine, { agentId: theirAgent.externalId })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('not available to this project')
    })

    it('refuses a step that both links an agent and carries its own tools', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)

        const response = await startRun(ctx, {
            agentId: agent.externalId,
            tools: [{ type: 'PIECE', toolName: 'send_email', pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' } }],
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('ambiguous')
    })

    it('still runs a step that carries its own tools and links nothing', async () => {
        const ctx = await context()

        const response = await startRun(ctx, {
            modelName: 'gpt-5',
            provider: AIProviderName.OPENAI,
            tools: [{ type: 'PIECE', toolName: 'send_email', pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' } }],
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('rejects an agent id that is not an id at all', async () => {
        const ctx = await context()

        const response = await startRun(ctx, { agentId: 'x'.repeat(5_000) })

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
    })

    it('runs the agent\'s own model, not the one left on the step', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)

        const linkedRun = await startRun(ctx, { agentId: agent.externalId, provider: AIProviderName.ANTHROPIC, modelName: 'claude-x' })
        const inlineRun = await startRun(ctx, {
            provider: AIProviderName.ANTHROPIC,
            modelName: 'claude-x',
            tools: [{ type: 'PIECE', toolName: 'send_email', pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'send_email' } }],
        })

        expect(linkedRun.statusCode).toBe(StatusCodes.OK)
        expect(inlineRun.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('refuses an agent the running flow version never named, so a payload cannot choose one', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)
        const bound = await flowRunNaming({ ctx, agentIds: [] })

        const response = await startRun(ctx, { agentId: agent.externalId }, bound)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('did not name that agent')
    })

    it('takes the step from the waitpoint, so naming another step in the request changes nothing', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)
        const bound = await flowRunNaming({ ctx, agentIds: [] })

        const response = await startRun(ctx, { agentId: agent.externalId, stepName: AGENT_STEP_NAME }, bound)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('did not name that agent')
    })

    it('will not publish an agent that pins a key without naming its provider', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx, { provider: null, providerConfigId: apId() })

        const response = await ctx.post(`/v1/agents/${agent.id}/publish`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('without naming its provider')
    })

    it('refuses an agent the project cannot all see, since nobody is watching the run', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}`, { visibility: AgentVisibility.RESTRICTED, sharedWithUserIds: [] })
        await ctx.post(`/v1/agents/${agent.id}/publish`)

        const response = await startRun(ctx, { agentId: agent.externalId })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('not available to this project')
    })

    it('refuses an agent that belongs to a sibling step, not the one the waitpoint names', async () => {
        const ctx = await context()
        const mine = await createAgent(ctx)
        const siblings = await createAgent(ctx)
        await ctx.post(`/v1/agents/${mine.id}/publish`)
        await ctx.post(`/v1/agents/${siblings.id}/publish`)
        const bound = await flowRunNaming({ ctx, agentIds: [mine.externalId], siblingAgentId: siblings.externalId })

        const response = await startRun(ctx, { agentId: siblings.externalId }, bound)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('did not name that agent')
    })

    // A step that is not the Run Agent action can carry any input map, and the delete guard only
    // counts agent ids on agent steps. Accepting one here would break the pair.
    it('refuses an agentId carried by a step that is not the agent action', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)
        const bound = await flowRunNaming({ ctx, agentIds: [agent.externalId], stepIsAgentPiece: false })

        const response = await startRun(ctx, { agentId: agent.externalId }, bound)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('did not name that agent')
    })

    // One waitpoint is one agent run. Replaying a finished one fires the agent's tools again with
    // nobody watching.
    it('refuses a waitpoint whose agent run already happened', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)
        const bound = await flowRunNaming({ ctx, agentIds: [agent.externalId] })

        const first = await startRun(ctx, { agentId: agent.externalId }, bound)
        await db.update('waitpoint', bound.waitpointId, { status: WaitpointStatus.COMPLETED })
        const replay = await startRun(ctx, { agentId: agent.externalId }, bound)

        expect(first.statusCode).toBe(StatusCodes.OK)
        expect(replay.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(replay.json())).toContain('already had its agent run')
    })

    it('refuses a flow where two steps share the paused step name', async () => {
        const ctx = await context()
        const mine = await createAgent(ctx)
        const theirs = await createAgent(ctx)
        await ctx.post(`/v1/agents/${mine.id}/publish`)
        await ctx.post(`/v1/agents/${theirs.id}/publish`)
        const bound = await flowRunNaming({ ctx, agentIds: [mine.externalId], siblingAgentId: theirs.externalId, siblingSharesName: true })

        const response = await startRun(ctx, { agentId: mine.externalId }, bound)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('ambiguous')
    })
})

// An approval binds one flow version. The agent it links is not inside that version, so
// republishing the agent would change what an approved flow runs, with no approver in the loop.
describe('an agent a published flow already runs', () => {
    async function sensitiveProject(): Promise<{ owner: TestContext, editor: TestContext }> {
        const owner = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, environmentsEnabled: true } })
        await mockAndSaveAIProvider({ platformId: owner.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
        await db.update('project', owner.project.id, { sensitive: true })
        const editor = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        return { owner, editor }
    }

    it('cannot be republished by someone who cannot publish sensitive flows', async () => {
        const { owner, editor } = await sensitiveProject()
        const agent = await createAgent(owner)
        await owner.post(`/v1/agents/${agent.id}/publish`)
        await flowRunNaming({ ctx: owner, agentIds: [agent.externalId], publish: true })

        const republished = await editor.post(`/v1/agents/${agent.id}/publish`)
        const savedLive = await editor.post(`/v1/agents/${agent.id}`, { draft: { ...agent.draft, instructions: 'Send email to everyone.' }, goLive: true })

        expect(republished.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(republished.json())).toContain('needs approval')
        expect(savedLive.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('is still publishable by someone who can publish sensitive flows', async () => {
        const { owner } = await sensitiveProject()
        const agent = await createAgent(owner)
        await owner.post(`/v1/agents/${agent.id}/publish`)
        await flowRunNaming({ ctx: owner, agentIds: [agent.externalId], publish: true })

        const response = await owner.post(`/v1/agents/${agent.id}/publish`)

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('is publishable by an editor while no published flow runs it', async () => {
        const { owner, editor } = await sensitiveProject()
        const agent = await createAgent(owner)

        const response = await editor.post(`/v1/agents/${agent.id}/publish`)

        expect(response.statusCode).toBe(StatusCodes.OK)
    })
})

describe('what the linked run actually sends to the worker', () => {
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

    it('sends the agent\'s instructions, tools, model and step budget, not the step\'s own', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx, {
            instructions: 'Sort the inbox.',
            maxSteps: 7,
            tools: [{ type: AgentToolType.PIECE, toolName: 'read_inbox', pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.1.0', actionName: 'gmail_search_mail' } }],
        })
        await ctx.post(`/v1/agents/${agent.id}/publish`)

        const response = await startRun(ctx, {
            agentId: agent.externalId,
            provider: AIProviderName.ANTHROPIC,
            modelName: 'claude-x',
            maxSteps: 99,
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const job = addSpy.mock.calls.map(([call]) => call).find((call) => call.data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)
        expect(job).toBeDefined()
        expect(job.data.promptOverride).toEqual({ system: 'Sort the inbox.' })
        expect(job.data.modelName).toBe('gpt-5')
        expect(job.data.provider).toBe(AIProviderName.OPENAI)
        expect(job.data.maxSteps).toBe(7)
        expect(job.data.tools.map((tool: { toolName: string }) => tool.toolName)).toEqual(['read_inbox'])
        expect(job.data.source).toBe(AgentRunSource.FLOW_STEP)
    })

    it('still sends an MCP tool to the worker, which is the only thing that can run it', async () => {
        const ctx = await context()

        const response = await startRun(ctx, {
            provider: AIProviderName.OPENAI,
            modelName: 'gpt-5',
            maxSteps: 10,
            tools: [{
                type: AgentToolType.MCP,
                toolName: 'internal-api',
                serverUrl: 'https://mcp.example.com/sse',
                protocol: McpProtocol.SSE,
                auth: { type: McpAuthType.NONE },
            }],
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const job = addSpy.mock.calls.map(([call]) => call).find((call) => call.data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)
        expect(job.data.tools).toHaveLength(1)
        expect(job.data.tools[0].toolName).toBe('internal-api')
    })

    it('leaves an unlinked step running its own config, with no instructions of ours', async () => {
        const ctx = await context()

        const response = await startRun(ctx, {
            provider: AIProviderName.OPENAI,
            modelName: 'gpt-5',
            maxSteps: 99,
            tools: [],
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const job = addSpy.mock.calls.map(([call]) => call).find((call) => call.data.jobType === WorkerJobType.EXECUTE_AGENT_RUN)
        expect(job).toBeDefined()
        expect(job.data.promptOverride).toBeUndefined()
        expect(job.data.modelName).toBe('gpt-5')
        expect(job.data.maxSteps).toBe(99)
    })
})

describe('deleting an agent a flow still uses', () => {
    async function flowUsingAgent({ ctx, externalId, published, supersededBy }: {
        ctx: TestContext
        externalId: string
        published: boolean
        supersededBy?: string[]
    }) {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)
        const version = createMockFlowVersion({
            flowId: flow.id,
            updatedBy: ctx.user.id,
            displayName: 'Nightly inbox sweep',
            agentIds: [externalId],
            created: '2026-08-01T00:00:00.000Z',
        })
        await db.save('flow_version', version)
        if (published) {
            await db.update('flow', flow.id, { publishedVersionId: version.id })
        }
        if (supersededBy) {
            await db.save('flow_version', createMockFlowVersion({
                flowId: flow.id,
                updatedBy: ctx.user.id,
                displayName: 'Nightly inbox sweep',
                agentIds: supersededBy,
                created: '2026-08-02T00:00:00.000Z',
            }))
        }
    }

    it('is refused when a published flow runs it, and names the flow', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await flowUsingAgent({ ctx, externalId: agent.externalId, published: true })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('Nightly inbox sweep')
    })

    it('is refused for a published version even when a newer draft dropped the step', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await flowUsingAgent({ ctx, externalId: agent.externalId, published: true, supersededBy: [] })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('Nightly inbox sweep')
    })

    it('goes through while only a draft uses it, since a draft does not run', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await flowUsingAgent({ ctx, externalId: agent.externalId, published: false })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect([StatusCodes.OK, StatusCodes.NO_CONTENT]).toContain(response.statusCode)
    })

    it('goes through once the step is gone, even though old versions still mention it', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await flowUsingAgent({ ctx, externalId: agent.externalId, published: false, supersededBy: [] })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect([StatusCodes.OK, StatusCodes.NO_CONTENT]).toContain(response.statusCode)
    })

    it('refuses unpublishing it too, since that breaks the next run exactly as much', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)
        await flowUsingAgent({ ctx, externalId: agent.externalId, published: true })

        const response = await ctx.post(`/v1/agents/${agent.id}/unpublish`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('Nightly inbox sweep')
    })

    it('ignores a flow in another project', async () => {
        const ctx = await context()
        const other = await context()
        const agent = await createAgent(ctx)
        await flowUsingAgent({ ctx: other, externalId: agent.externalId, published: true })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect([StatusCodes.OK, StatusCodes.NO_CONTENT]).toContain(response.statusCode)
    })
})
