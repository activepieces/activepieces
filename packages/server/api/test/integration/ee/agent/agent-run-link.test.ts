import { AIProviderName, apId } from '@activepieces/core-utils'
import { AgentIcon, ColorName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { accessTokenManager } from '../../../../src/app/authentication/lib/access-token-manager'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const RUNS_URL = '/api/v1/agents/runs'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
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

async function startRun(ctx: TestContext, body: Record<string, unknown>) {
    const engineToken = await accessTokenManager(app.log).generateEngineToken({
        jobId: apId(),
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
    })
    return app.inject({
        method: 'POST',
        url: RUNS_URL,
        headers: { authorization: `Bearer ${engineToken}` },
        body: { instruction: 'clear my inbox', flowRunId: apId(), waitpointId: apId(), ...body },
    })
}

describe('a flow step that links a saved agent', () => {
    it('runs the published agent, not the draft the owner is still editing', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)
        await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agent.draft, instructions: 'Half-written change.' } })

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
        expect(JSON.stringify(response.json())).toContain('not in this project')
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

})

describe('deleting an agent a flow still runs', () => {
    async function publishedFlowRunning({ ctx, externalId, published }: { ctx: TestContext, externalId: string, published: boolean }) {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)
        const version = createMockFlowVersion({
            flowId: flow.id,
            updatedBy: ctx.user.id,
            displayName: 'Nightly inbox sweep',
            agentIds: [externalId],
        })
        await db.save('flow_version', version)
        if (published) {
            await db.update('flow', flow.id, { publishedVersionId: version.id })
        }
    }

    it('is refused, and names the flow', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await publishedFlowRunning({ ctx, externalId: agent.externalId, published: true })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('Nightly inbox sweep')
    })

    it('goes through when only a draft references it, because no run is live yet', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await publishedFlowRunning({ ctx, externalId: agent.externalId, published: false })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect([StatusCodes.OK, StatusCodes.NO_CONTENT]).toContain(response.statusCode)
    })

    it('ignores a published flow in another project', async () => {
        const ctx = await context()
        const other = await context()
        const agent = await createAgent(ctx)
        await publishedFlowRunning({ ctx: other, externalId: agent.externalId, published: true })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect([StatusCodes.OK, StatusCodes.NO_CONTENT]).toContain(response.statusCode)
    })
})
