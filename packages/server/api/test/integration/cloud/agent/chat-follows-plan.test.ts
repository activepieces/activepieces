import { AgentIcon, ColorName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('chat on Cloud follows the plan', () => {
    it('opens for a user whose plan includes chat', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const conversations = await ctx.get('/v1/agents/conversations')
        const platform = await ctx.get(`/v1/platforms/${ctx.platform.id}`)

        expect(conversations.statusCode).toBe(StatusCodes.OK)
        expect(platform.json().plan.chatEnabled).toBe(true)
    })

    it('stays closed for a user whose plan does not include chat, even with no rollout cap in the way', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: false } })

        const conversations = await ctx.get('/v1/agents/conversations')
        const platform = await ctx.get(`/v1/platforms/${ctx.platform.id}`)

        expect(conversations.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(platform.json().plan.chatEnabled).toBe(false)
    })

    it('keeps an agent\'s run history readable on a plan with agents but no chat', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: false } })
        const agent = await ctx.post('/v1/agents', {
            projectId: ctx.project.id,
            displayName: 'Nightly agent',
            description: null,
            icon: AgentIcon.BOT,
            color: ColorName.PURPLE,
            draft: { instructions: 'Do the nightly job.', maxSteps: 5, tools: [], structuredOutput: [], modelName: null },
        })

        const runs = await ctx.get(`/v1/agents/conversations/runs?projectId=${ctx.project.id}&agentId=${agent.json().id}`)
        const chat = await ctx.get('/v1/agents/conversations')

        expect(runs.statusCode).toBe(StatusCodes.OK)
        expect(chat.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })
})
