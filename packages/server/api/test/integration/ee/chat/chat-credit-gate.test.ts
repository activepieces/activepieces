import { AIProviderName } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const CONVERSATIONS_URL = '/v1/chat/conversations'

async function sendMessage(ctx: TestContext) {
    const conversationResponse = await ctx.post(CONVERSATIONS_URL, {})
    expect(conversationResponse.statusCode).toBe(StatusCodes.CREATED)
    const conversationId = conversationResponse.json().id
    return ctx.post(`${CONVERSATIONS_URL}/${conversationId}/messages`, { content: 'hello' })
}

describe('Chat credit gate on self-hosted (managed AI unavailable)', () => {
    it('rejects messages with a provider-not-found error instead of AI_CREDIT_LIMIT_EXCEEDED when the activepieces provider holds the chat toggle', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.ACTIVEPIECES,
        })

        const response = await sendMessage(ctx)

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(response.json().code).toBe('ENTITY_NOT_FOUND')
        expect(response.json().params.entityType).toBe('ChatAiProvider')
    })

    it('rejects messages with a provider-not-found error when no chat provider is configured', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const response = await sendMessage(ctx)

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(response.json().params.entityType).toBe('ChatAiProvider')
    })

    it('excludes the activepieces provider from the provider list', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.ACTIVEPIECES,
        })

        const response = await ctx.get('/v1/ai-providers')

        expect(response.statusCode).toBe(StatusCodes.OK)
        const providers: { provider: string }[] = response.json()
        expect(providers.some((p) => p.provider === AIProviderName.ACTIVEPIECES)).toBe(false)
    })

    it('resolves the BYOK chat provider when a stale activepieces row is also flagged for chat', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.ACTIVEPIECES,
        })
        const byokProvider = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.OPENAI,
        })
        await db.update('ai_provider', byokProvider.id, { enabledForChat: true })

        const response = await sendMessage(ctx)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().runId).toBeDefined()
    })

    it('still sends messages through a BYOK chat provider', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const byokProvider = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.OPENAI,
        })
        await db.update('ai_provider', byokProvider.id, { enabledForChat: true })

        const response = await sendMessage(ctx)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().runId).toBeDefined()
    })
})
