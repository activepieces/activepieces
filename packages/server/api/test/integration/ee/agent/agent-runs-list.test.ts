import { apId } from '@activepieces/core-utils'
import { AgentIcon, AgentRunSource, AgentVisibility, ColorName, DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
}

async function createAgent(ctx: TestContext): Promise<{ id: string }> {
    const created = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Nightly sweeper',
        description: 'Sweeps the inbox',
        icon: AgentIcon.BOT,
        color: ColorName.PURPLE,
        visibility: AgentVisibility.PROJECT,
        draft: { instructions: 'Sweep it.', maxSteps: 5, tools: [], structuredOutput: [], modelName: null },
    })
    return { id: created.json().id }
}

async function seedRun({ ctx, agentId, source, projectId, title }: {
    ctx: TestContext
    agentId: string | null
    source: AgentRunSource
    projectId?: string
    title?: string
}): Promise<string> {
    const id = apId()
    await db.save('agent_conversation', {
        id,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: ctx.platform.id,
        projectId: projectId ?? ctx.project.id,
        userId: ctx.user.id,
        agentId,
        source,
        title: title ?? 'A run',
        status: 'IDLE',
        messages: [],
        uiMessages: [],
    })
    return id
}

function listRuns(ctx: TestContext, agentId: string, projectId?: string) {
    return ctx.get(`/v1/agents/conversations/runs?projectId=${projectId ?? ctx.project.id}&agentId=${agentId}`)
}

describe('the runs a flow step made with an agent', () => {
    it('lists the unattended runs, which is the half of the history nobody could see', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        const runId = await seedRun({ ctx, agentId: agent.id, source: AgentRunSource.FLOW_STEP, title: 'Swept the inbox' })

        const response = await listRuns(ctx, agent.id)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().data.map((run: { id: string }) => run.id)).toEqual([runId])
    })

    it('leaves out the conversations someone had with the agent, which already have their own list', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await seedRun({ ctx, agentId: agent.id, source: AgentRunSource.AGENT })
        await seedRun({ ctx, agentId: agent.id, source: AgentRunSource.CHAT })

        const response = await listRuns(ctx, agent.id)

        expect(response.json().data).toHaveLength(0)
    })

    it('leaves out another agent\'s runs, so the list means what its title says', async () => {
        const ctx = await context()
        const mine = await createAgent(ctx)
        const other = await createAgent(ctx)
        await seedRun({ ctx, agentId: other.id, source: AgentRunSource.FLOW_STEP })

        const response = await listRuns(ctx, mine.id)

        expect(response.json().data).toHaveLength(0)
    })

    it('does not reach into another project even for the same agent id, so the query stands on its own', async () => {
        const ctx = await context()
        const elsewhere = await context()
        const agent = await createAgent(ctx)
        await seedRun({ ctx, agentId: agent.id, source: AgentRunSource.FLOW_STEP, projectId: elsewhere.project.id })

        const response = await listRuns(ctx, agent.id)

        expect(response.json().data).toHaveLength(0)
    })

    it('refuses a project the caller does not belong to', async () => {
        const ctx = await context()
        const stranger = await context()
        const agent = await createAgent(ctx)

        const response = await listRuns(ctx, agent.id, stranger.project.id)

        expect(response.statusCode).not.toBe(StatusCodes.OK)
    })

    it('hides the runs of an agent the caller cannot read, since restricting an agent does not delete its history', async () => {
        const ctx = await context()
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(ctx)
        await seedRun({ ctx, agentId: agent.id, source: AgentRunSource.FLOW_STEP, title: 'Swept the inbox' })
        await ctx.post(`/v1/agents/${agent.id}`, { visibility: AgentVisibility.RESTRICTED })

        const response = await member.get(`/v1/agents/conversations/runs?projectId=${ctx.project.id}&agentId=${agent.id}`)

        expect(response.statusCode).not.toBe(StatusCodes.OK)
        expect(JSON.stringify(response.json())).not.toContain('Swept the inbox')
    })

    it('still shows them to someone who can read the agent', async () => {
        const ctx = await context()
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(ctx)
        const runId = await seedRun({ ctx, agentId: agent.id, source: AgentRunSource.FLOW_STEP })

        const response = await member.get(`/v1/agents/conversations/runs?projectId=${ctx.project.id}&agentId=${agent.id}`)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().data.map((run: { id: string }) => run.id)).toEqual([runId])
    })

    it('is not swallowed by the conversation-by-id route, which shares its prefix', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const response = await listRuns(ctx, agent.id)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toHaveProperty('data')
    })
})
