import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('chat on Cloud', () => {
    it('opens for a user whose plan does not include chat, even where the old rollout cap had closed', async () => {
        await distributedStore.putBoolean('chat-rollout:closed', true)
        const ctx = await createTestContext(app, { plan: { chatEnabled: false } })

        const conversations = await ctx.get('/v1/agents/conversations')
        const platform = await ctx.get(`/v1/platforms/${ctx.platform.id}`)

        expect(conversations.statusCode).toBe(StatusCodes.OK)
        expect(platform.json().plan.chatEnabled).toBe(true)
    })
})
