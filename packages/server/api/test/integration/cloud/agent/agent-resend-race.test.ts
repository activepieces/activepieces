import { AgentConversationStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { db } from '../../../helpers/db'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('re-sending a message while the first run has not started yet', () => {
    it('lets the newer run start and turns the older run away without a busy rejection', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const created = await ctx.post('/v1/agents/conversations', { title: 'Resend' })
        const conversationId = created.json().id

        await agentHelpers.claimConversationForRun({ conversationId, runId: 'run-1' })
        await agentHelpers.claimConversationForRun({ conversationId, runId: 'run-2' })

        const older = await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })
        const newer = await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-2' })

        expect(older).toBe('superseded')
        expect(newer).toBe('acquired')
        const stored = await db.findOneByOrFail<{ status: string, activeRunId: string }>('agent_conversation', { id: conversationId })
        expect(stored.status).toBe(AgentConversationStatus.STREAMING)
        expect(stored.activeRunId).toBe('run-2')
    })

    it('reports a redelivered run as a duplicate and leaves the first delivery streaming', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const created = await ctx.post('/v1/agents/conversations', { title: 'Duplicate' })
        const conversationId = created.json().id
        await agentHelpers.claimConversationForRun({ conversationId, runId: 'run-1' })

        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('acquired')
        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('duplicate')
        const stored = await db.findOneByOrFail<{ status: string, activeRunId: string }>('agent_conversation', { id: conversationId })
        expect(stored.status).toBe(AgentConversationStatus.STREAMING)
        expect(stored.activeRunId).toBe('run-1')
    })

    it('lets the redelivered copy take a lock handed to it once, when the first delivery never received its config', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const created = await ctx.post('/v1/agents/conversations', { title: 'Undelivered config' })
        const conversationId = created.json().id
        await agentHelpers.claimConversationForRun({ conversationId, runId: 'run-1' })
        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('acquired')

        await agentHelpers.handLockToRedelivery({ conversationId, runId: 'run-1' })

        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('handed-off')
        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('duplicate')
    })

    it('leaves the run streaming for the stale sweep when the copy is turned away before the hand-off', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const created = await ctx.post('/v1/agents/conversations', { title: 'Early copy' })
        const conversationId = created.json().id
        await agentHelpers.claimConversationForRun({ conversationId, runId: 'run-1' })
        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('acquired')
        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('duplicate')

        await agentHelpers.handLockToRedelivery({ conversationId, runId: 'run-1' })

        const stored = await db.findOneByOrFail<{ status: string, activeRunId: string }>('agent_conversation', { id: conversationId })
        expect(stored.status).toBe(AgentConversationStatus.STREAMING)
        expect(stored.activeRunId).toBe('run-1')
    })

    it('drops a copy delivered after its run finished, so the agent and its tools do not run twice', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const created = await ctx.post('/v1/agents/conversations', { title: 'Late copy' })
        const conversationId = created.json().id
        await agentHelpers.claimConversationForRun({ conversationId, runId: 'run-1' })
        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('acquired')
        await db.update('agent_conversation', conversationId, { status: AgentConversationStatus.IDLE })

        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('duplicate')
        const stored = await db.findOneByOrFail<{ status: string }>('agent_conversation', { id: conversationId })
        expect(stored.status).toBe(AgentConversationStatus.IDLE)
    })

    it('still reports busy when a run without an id finds the conversation already streaming', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const created = await ctx.post('/v1/agents/conversations', { title: 'Busy' })
        const conversationId = created.json().id

        expect(await agentHelpers.acquireStreamingLock({ conversationId })).toBe('acquired')
        expect(await agentHelpers.acquireStreamingLock({ conversationId })).toBe('busy')
    })
})
