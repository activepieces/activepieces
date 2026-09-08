import { tryCatch } from '@activepieces/core-utils'
import { AgentActionKind, AgentActionOutcome, AgentIcon, AgentRunSource, AIProviderName, apId, ApplicationEvent, ApplicationEventName, ColorName, summarizeApplicationEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { executeCrossProjectTool } from '../../../../src/app/ee/agent/tools/agent-tools'
import { pieceToolRunner } from '../../../../src/app/ee/agent/tools/piece-tool-runner'
import * as mcpServerBuilder from '../../../../src/app/mcp/mcp-server-builder'
import * as flowRunUtils from '../../../../src/app/mcp/tools/flow-run-utils'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../helpers/mocks'
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

const RECIPIENT = 'someone@example.com'

async function contextWithProvider(): Promise<TestContext> {
    const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true, auditLogEnabled: true } })
    await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
    return ctx
}

async function conversationFor(ctx: TestContext, params: { source: AgentRunSource, withAgent: boolean }): Promise<{ conversationId: string, agentId?: string }> {
    const agentId = params.withAgent ? (await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Ops agent',
        description: null,
        icon: AgentIcon.BOT,
        color: ColorName.PURPLE,
        draft: { instructions: 'Do the ops work.', maxSteps: 5, tools: [], structuredOutput: [], modelName: null },
    })).json().id : undefined
    const conversationId = apId()
    await db.save('agent_conversation', {
        id: conversationId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: ctx.platform.id,
        projectId: ctx.project.id,
        userId: ctx.user.id,
        agentId: agentId ?? null,
        source: params.source,
        status: 'STREAMING',
        messages: [],
        uiMessages: [],
    })
    return { conversationId, ...(agentId === undefined ? {} : { agentId }) }
}

function stubTheRun(params: { classification?: string, input?: Record<string, unknown> } = {}): void {
    const resolvedInput = params.input ?? { to: RECIPIENT, subject: 'hello' }
    vi.spyOn(pieceToolRunner, 'resolveInput').mockResolvedValue({
        resolvedInput,
        actionDisplayName: 'Send Email',
        pieceDisplayName: 'Gmail',
        ...(params.classification === undefined ? {} : { classification: params.classification }),
    } as never)
    vi.spyOn(pieceToolRunner, 'runResolved').mockResolvedValue({ result: { success: true }, resolvedInput } as never)
}

async function agentActionRows(ctx: TestContext): Promise<ApplicationEvent[]> {
    for (let attempt = 0; attempt < 24; attempt++) {
        const rows = await db.findBy<ApplicationEvent>('audit_event', { platformId: ctx.platform.id })
        const found = rows.filter((row) => row.action === ApplicationEventName.AGENT_ACTION_EXECUTED)
        if (found.length > 0) {
            return found
        }
        await new Promise((resolve) => setTimeout(resolve, 25))
    }
    return []
}

async function runConfiguredAction(conversationId: string, actionName: string) {
    return agentRpcHandlers(app.log).executePieceTool({
        conversationId,
        toolName: `gmail-${actionName}`,
        instruction: 'do the thing',
        piece: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.9.0', actionName },
    })
}

describe('an action an agent ran reaches the audit log', () => {
    it('records the whole row a person needs: who, what, where and which account', async () => {
        const ctx = await contextWithProvider()
        const { conversationId, agentId } = await conversationFor(ctx, { source: AgentRunSource.AGENT, withAgent: true })
        stubTheRun()

        await runConfiguredAction(conversationId, 'send_email')

        const [row] = await agentActionRows(ctx)
        expect(row).toBeDefined()
        expect(row.projectId).toBe(ctx.project.id)
        expect(row.userId).toBe(ctx.user.id)
        expect(row.data).toMatchObject({
            source: AgentRunSource.AGENT,
            conversation: { id: conversationId, source: AgentRunSource.AGENT },
            agent: { id: agentId, displayName: 'Ops agent' },
            action: {
                kind: AgentActionKind.PIECE,
                pieceName: '@activepieces/piece-gmail',
                pieceDisplayName: 'Gmail',
                actionName: 'send_email',
                displayName: 'Send Email',
            },
            outcome: AgentActionOutcome.SUCCEEDED,
        })
        expect(summarizeApplicationEvent(row)).toBe('Ops agent ran Gmail: Send Email')
    })

    it('records an action that was attempted and failed, so a reviewer sees the try', async () => {
        const ctx = await contextWithProvider()
        const { conversationId } = await conversationFor(ctx, { source: AgentRunSource.AGENT, withAgent: true })
        stubTheRun()
        vi.spyOn(pieceToolRunner, 'runResolved').mockRejectedValue(new Error('the provider said no'))

        const { error } = await tryCatch(() => runConfiguredAction(conversationId, 'send_email'))
        expect(error).toBeDefined()

        const [row] = await agentActionRows(ctx)
        expect(row.data).toMatchObject({ outcome: AgentActionOutcome.FAILED })
        expect(summarizeApplicationEvent(row)).toBe('Ops agent tried to run Gmail: Send Email')
    })

    it('records nothing when the action could not be prepared, because nothing was called', async () => {
        const ctx = await contextWithProvider()
        const { conversationId } = await conversationFor(ctx, { source: AgentRunSource.AGENT, withAgent: true })
        vi.spyOn(pieceToolRunner, 'resolveInput').mockRejectedValue(new Error('the piece would not describe itself'))

        const { error } = await tryCatch(() => runConfiguredAction(conversationId, 'send_email'))
        expect(error).toBeDefined()

        expect(await agentActionRows(ctx)).toEqual([])
    })

    it('records a flow the agent chose to run, which is otherwise only a flow run', async () => {
        const ctx = await contextWithProvider()
        const { conversationId } = await conversationFor(ctx, { source: AgentRunSource.AGENT, withAgent: true })
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)
        const version = createMockFlowVersion({ flowId: flow.id, updatedBy: ctx.user.id, displayName: 'Refund handler' })
        await db.save('flow_version', version)
        vi.spyOn(mcpServerBuilder, 'resolveRunnableFlow').mockResolvedValue({ ...flow, version } as never)
        vi.spyOn(mcpServerBuilder, 'runFlowAsTool').mockResolvedValue({ content: [] } as never)

        await agentRpcHandlers(app.log).executeFlowTool({
            conversationId,
            toolName: 'flow-refund-handler',
            flowId: flow.id,
            toolInput: {},
            returnsResponse: false,
        })

        const [row] = await agentActionRows(ctx)
        expect(row.data).toMatchObject({
            action: { kind: AgentActionKind.FLOW, flowId: flow.id, displayName: 'Refund handler' },
            outcome: AgentActionOutcome.SUCCEEDED,
        })
        expect(summarizeApplicationEvent(row)).toBe('Ops agent ran the flow Refund handler')
    })

    it('keeps the action input out of the row', async () => {
        const ctx = await contextWithProvider()
        const { conversationId } = await conversationFor(ctx, { source: AgentRunSource.AGENT, withAgent: true })
        stubTheRun()

        await runConfiguredAction(conversationId, 'send_email')

        const [row] = await agentActionRows(ctx)
        expect(JSON.stringify(row.data)).not.toContain(RECIPIENT)
    })

    it('leaves a read out of it', async () => {
        const ctx = await contextWithProvider()
        const { conversationId } = await conversationFor(ctx, { source: AgentRunSource.AGENT, withAgent: true })
        stubTheRun()

        await runConfiguredAction(conversationId, 'search_mail')

        expect(await agentActionRows(ctx)).toHaveLength(0)
    })

    it('believes the piece over the action name, in both directions', async () => {
        const ctx = await contextWithProvider()
        const write = await conversationFor(ctx, { source: AgentRunSource.AGENT, withAgent: true })
        stubTheRun({ classification: 'WRITE' })
        await runConfiguredAction(write.conversationId, 'search_and_replace_text')
        expect(await agentActionRows(ctx)).toHaveLength(1)

        const other = await contextWithProvider()
        const read = await conversationFor(other, { source: AgentRunSource.AGENT, withAgent: true })
        stubTheRun({ classification: 'READ' })
        await runConfiguredAction(read.conversationId, 'send_report')
        expect(await agentActionRows(other)).toHaveLength(0)
    })

    it('records a flow step that runs inline tools, with no agent to name', async () => {
        const ctx = await contextWithProvider()
        const { conversationId } = await conversationFor(ctx, { source: AgentRunSource.FLOW_STEP, withAgent: false })
        stubTheRun()

        await runConfiguredAction(conversationId, 'send_email')

        const [row] = await agentActionRows(ctx)
        expect(row.data).toMatchObject({ source: AgentRunSource.FLOW_STEP })
        expect(row.data).not.toHaveProperty('agent')
        expect(summarizeApplicationEvent(row)).toBe('An agent ran Gmail: Send Email')
    })

    it('names the flow run it came from, so a destination cycle can be told apart', async () => {
        const ctx = await contextWithProvider()
        const { conversationId } = await conversationFor(ctx, { source: AgentRunSource.FLOW_STEP, withAgent: false })
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)
        const version = createMockFlowVersion({ flowId: flow.id, updatedBy: ctx.user.id })
        await db.save('flow_version', version)
        const flowRun = createMockFlowRun({ projectId: ctx.project.id, flowId: flow.id, flowVersionId: version.id })
        await db.save('flow_run', flowRun)
        stubTheRun()

        await agentRpcHandlers(app.log).executePieceTool({
            conversationId,
            flowRunId: flowRun.id,
            toolName: 'gmail-send_email',
            instruction: 'do the thing',
            piece: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.9.0', actionName: 'send_email' },
        })

        const [row] = await agentActionRows(ctx)
        expect(row.data).toMatchObject({ flow: { id: flow.id, runId: flowRun.id } })
    })

    it('records a write chat ran, not only a configured tool', async () => {
        const ctx = await contextWithProvider()
        const { conversationId } = await conversationFor(ctx, { source: AgentRunSource.CHAT, withAgent: false })
        vi.spyOn(flowRunUtils, 'executePieceActionRun').mockResolvedValue({ content: [] } as never)

        await executeCrossProjectTool({
            toolName: 'ap_execute_action',
            toolInput: { pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { to: RECIPIENT } },
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            conversationId,
            log: app.log,
        })

        const [row] = await agentActionRows(ctx)
        expect(row).toBeDefined()
        expect(row.data).toMatchObject({ source: AgentRunSource.CHAT })
        expect(JSON.stringify(row.data)).not.toContain(RECIPIENT)
    })
})
