import { AgentConversationStatus, AgentRunSource, apId, FlowRunStatus, FlowVersionState } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { payloadOffloader } from '../../../../src/app/workers/payload-offloader'
import { WaitpointStatus } from '../../../../src/app/waitpoints/waitpoint-types'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const CONVERSATIONS_URL = '/v1/agents/conversations'

describe('Chat conversation stuck in STREAMING status', () => {

    it('recently set to STREAMING stays STREAMING (agent still running)', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Active Stream' })
        expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
        const conversationId = createResponse.json().id

        // Set status to STREAMING with a recent updated timestamp (default behavior)
        await db.update('agent_conversation', conversationId, {
            status: AgentConversationStatus.STREAMING,
        })

        // Should stay STREAMING because updated is recent
        const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
        expect(getResponse.statusCode).toBe(StatusCodes.OK)
        expect(getResponse.json().status).toBe(AgentConversationStatus.STREAMING)
    })

    it('auto-recovers stale STREAMING conversation to IDLE after timeout', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Will Auto-Recover' })
        const conversationId = createResponse.json().id

        // Set status to STREAMING with an old updated timestamp (simulating worker crash 5 min ago, past the 2-min threshold)
        const twentyMinutesAgo = new Date(Date.now() - 5 * 60 * 1_000).toISOString()
        await db.update('agent_conversation', conversationId, {
            status: AgentConversationStatus.STREAMING,
            updated: twentyMinutesAgo,
        })

        // GET should auto-recover to IDLE
        const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
        expect(getResponse.statusCode).toBe(StatusCodes.OK)
        expect(getResponse.json().status).toBe(AgentConversationStatus.IDLE)
    })

    it('auto-recovery persists to database so subsequent reads also see IDLE', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Persist Recovery' })
        const conversationId = createResponse.json().id

        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1_000).toISOString()
        await db.update('agent_conversation', conversationId, {
            status: AgentConversationStatus.STREAMING,
            updated: twentyMinutesAgo,
        })

        // First read triggers recovery
        await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)

        // Second read should also see IDLE (recovered status was persisted)
        const secondRead = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
        expect(secondRead.json().status).toBe(AgentConversationStatus.IDLE)
    })

    it('multiple stale conversations each auto-recover independently', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const conv1 = await ctx.post(CONVERSATIONS_URL, { title: 'Stuck 1' })
        const conv2 = await ctx.post(CONVERSATIONS_URL, { title: 'Stuck 2' })
        const id1 = conv1.json().id
        const id2 = conv2.json().id

        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1_000).toISOString()
        await db.update('agent_conversation', id1, { status: AgentConversationStatus.STREAMING, updated: twentyMinutesAgo })
        await db.update('agent_conversation', id2, { status: AgentConversationStatus.STREAMING, updated: twentyMinutesAgo })

        const get1 = await ctx.get(`${CONVERSATIONS_URL}/${id1}`)
        const get2 = await ctx.get(`${CONVERSATIONS_URL}/${id2}`)
        expect(get1.json().status).toBe(AgentConversationStatus.IDLE)
        expect(get2.json().status).toBe(AgentConversationStatus.IDLE)
    })

    it('does not auto-recover STREAMING within the timeout window', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Still Running' })
        const conversationId = createResponse.json().id

        // Set status to STREAMING updated 1 minute ago (within 2-min timeout)
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1_000).toISOString()
        await db.update('agent_conversation', conversationId, {
            status: AgentConversationStatus.STREAMING,
            updated: oneMinuteAgo,
        })

        // Should stay STREAMING — agent might still be running
        const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
        expect(getResponse.json().status).toBe(AgentConversationStatus.STREAMING)
    })

    it('IDLE and ERROR statuses are not affected by staleness check', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const idleConv = await ctx.post(CONVERSATIONS_URL, { title: 'Idle Old' })
        const errorConv = await ctx.post(CONVERSATIONS_URL, { title: 'Error Old' })

        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1_000).toISOString()
        await db.update('agent_conversation', idleConv.json().id, { updated: twentyMinutesAgo })
        await db.update('agent_conversation', errorConv.json().id, {
            status: AgentConversationStatus.ERROR,
            updated: twentyMinutesAgo,
        })

        const getIdle = await ctx.get(`${CONVERSATIONS_URL}/${idleConv.json().id}`)
        const getError = await ctx.get(`${CONVERSATIONS_URL}/${errorConv.json().id}`)
        expect(getIdle.json().status).toBe(AgentConversationStatus.IDLE)
        expect(getError.json().status).toBe(AgentConversationStatus.ERROR)
    })
})

describe('CHAT_STALE_SWEEP proactive recovery', () => {

    it('sweeps a stale STREAMING conversation to IDLE without a read', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const conversationId = (await ctx.post(CONVERSATIONS_URL, { title: 'Sweep Me' })).json().id

        await db.update('agent_conversation', conversationId, {
            status: AgentConversationStatus.STREAMING,
            updated: new Date(Date.now() - 5 * 60 * 1_000).toISOString(),
        })

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        // Read straight from the DB (not via GET, which would itself recover) to prove the sweep did it.
        const row = await db.findOneByOrFail<{ status: string }>('agent_conversation', { id: conversationId })
        expect(row.status).toBe(AgentConversationStatus.IDLE)
    })

    it('leaves a fresh STREAMING conversation running', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const conversationId = (await ctx.post(CONVERSATIONS_URL, { title: 'Still Streaming' })).json().id

        await db.update('agent_conversation', conversationId, {
            status: AgentConversationStatus.STREAMING,
            updated: new Date(Date.now() - 30 * 1_000).toISOString(),
        })

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        const row = await db.findOneByOrFail<{ status: string }>('agent_conversation', { id: conversationId })
        expect(row.status).toBe(AgentConversationStatus.STREAMING)
    })

    it('skips eval conversations even when stale', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const seedId = (await ctx.post(CONVERSATIONS_URL, { title: 'seed' })).json().id
        const seed = await db.findOneByOrFail<{ platformId: string, userId: string }>('agent_conversation', { id: seedId })

        const evalId = `evalconv${apId()}`.slice(0, 21)
        await db.save('agent_conversation', {
            id: evalId,
            platformId: seed.platformId,
            userId: seed.userId,
            status: AgentConversationStatus.STREAMING,
            messages: [],
        })
        await db.update('agent_conversation', evalId, {
            updated: new Date(Date.now() - 10 * 60 * 1_000).toISOString(),
        })

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        const row = await db.findOneByOrFail<{ status: string }>('agent_conversation', { id: evalId })
        expect(row.status).toBe(AgentConversationStatus.STREAMING)
    })

    it('releases the paused flow of a flow-step run whose worker died, so the flow does not wait out the step timeout', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const abandoned = await pausedFlowStepRun({ ctx, lastHeartbeat: new Date(Date.now() - 5 * 60 * 1_000) })
        const running = await pausedFlowStepRun({ ctx, lastHeartbeat: new Date(Date.now() - 30 * 1_000) })

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })
        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        expect(await db.findOneBy('waitpoint', { id: abandoned.waitpointId })).toBeNull()
        expect(await db.findOneBy('waitpoint', { id: running.waitpointId })).not.toBeNull()
    })

    it('resumes the flow with a failure that says the agent stopped, so the step fails with a reason', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        await pausedFlowStepRun({ ctx, lastHeartbeat: new Date(Date.now() - 5 * 60 * 1_000) })
        const offload = vi.spyOn(payloadOffloader, 'offloadPayload')

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        const resumedWith = offload.mock.calls.map(([, payload]) => payload)
        offload.mockRestore()
        expect(resumedWith).toContainEqual(expect.objectContaining({ body: expect.objectContaining({ failure: expect.stringContaining('The agent stopped responding before it finished') }) }))
    })

    it('never resumes a flow outside the conversation\'s own project, even if the row points at one', async () => {
        const victim = await createTestContext(app, { plan: { chatEnabled: true } })
        const attacker = await createTestContext(app, { plan: { chatEnabled: true } })
        const foreign = await pausedFlowStepRun({ ctx: victim, lastHeartbeat: new Date(Date.now() - 5 * 60 * 1_000), conversationProjectId: attacker.project.id })

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        expect(await db.findOneBy('waitpoint', { id: foreign.waitpointId })).not.toBeNull()
    })

    it('frees a flow-step row written by an older worker without a waitpoint, and leaves the step to its own timeout', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1_000)
        const legacy = await pausedFlowStepRun({ ctx, lastHeartbeat: fiveMinutesAgo })
        await db.update('agent_conversation', legacy.conversationId, { waitpointId: null, updated: fiveMinutesAgo.toISOString() })

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        const row = await db.findOneByOrFail<{ status: string }>('agent_conversation', { id: legacy.conversationId })
        expect(row.status).toBe(AgentConversationStatus.IDLE)
        expect(await db.findOneBy('waitpoint', { id: legacy.waitpointId })).not.toBeNull()
    })

    it('keeps a flow step whose release failed eligible for the next sweep, so one failed attempt does not strand the flow', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const unreleasable = await pausedFlowStepRun({ ctx, lastHeartbeat: new Date(Date.now() - 5 * 60 * 1_000), conversationProjectId: null })

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        const row = await db.findOneByOrFail<{ status: string }>('agent_conversation', { id: unreleasable.conversationId })
        expect(row.status).toBe(AgentConversationStatus.STREAMING)
        expect(await db.findOneBy('waitpoint', { id: unreleasable.waitpointId })).not.toBeNull()
    })

    it('stops retrying a release that keeps failing once the step has timed out, since the waitpoint timeout already ended the wait', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const pastTimeout = await pausedFlowStepRun({ ctx, lastHeartbeat: new Date(Date.now() - 4 * 60 * 60 * 1_000), conversationProjectId: null })

        await agentHelpers.recoverAllStaleStreamingConversations({ log: app.log })

        const row = await db.findOneByOrFail<{ status: string }>('agent_conversation', { id: pastTimeout.conversationId })
        expect(row.status).toBe(AgentConversationStatus.IDLE)
    })
})

async function pausedFlowStepRun({ ctx, lastHeartbeat, conversationProjectId = ctx.project.id }: { ctx: TestContext, lastHeartbeat: Date, conversationProjectId?: string | null }): Promise<{ conversationId: string, waitpointId: string }> {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const flowRun = createMockFlowRun({ projectId: ctx.project.id, flowId: flow.id, flowVersionId: flowVersion.id, status: FlowRunStatus.PAUSED })
    await db.save('flow_run', flowRun)
    const waitpointId = apId()
    await db.save('waitpoint', { id: waitpointId, flowRunId: flowRun.id, projectId: ctx.project.id, stepName: 'agent', type: 'WEBHOOK', status: WaitpointStatus.PENDING, httpRequestId: null, workerHandlerId: null })
    const conversationId = apId()
    await db.save('agent_conversation', {
        id: conversationId,
        platformId: ctx.platform.id,
        projectId: conversationProjectId,
        userId: ctx.user.id,
        source: AgentRunSource.FLOW_STEP,
        flowRunId: flowRun.id,
        waitpointId,
        activeRunId: apId(),
        status: AgentConversationStatus.STREAMING,
        messages: [],
    })
    await db.update('agent_conversation', conversationId, { created: lastHeartbeat.toISOString(), updated: lastHeartbeat.toISOString() })
    return { conversationId, waitpointId }
}
