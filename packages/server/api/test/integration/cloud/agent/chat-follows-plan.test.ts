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
})
