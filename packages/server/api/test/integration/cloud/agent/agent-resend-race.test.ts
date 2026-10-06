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

    it('still reports busy when the same run finds the conversation already streaming', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const created = await ctx.post('/v1/agents/conversations', { title: 'Busy' })
        const conversationId = created.json().id
        await agentHelpers.claimConversationForRun({ conversationId, runId: 'run-1' })

        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('acquired')
        expect(await agentHelpers.acquireStreamingLock({ conversationId, runId: 'run-1' })).toBe('busy')
    })
})
