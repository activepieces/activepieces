import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { FastifyInstance } from 'fastify'
import { ChatConversationStatus } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createTestContext } from '../../../helpers/test-context'
import { db } from '../../../helpers/db'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const CONVERSATIONS_URL = '/v1/chat/conversations'

describe('Chat conversation stuck in STREAMING status', () => {

    it('recently set to STREAMING stays STREAMING (agent still running)', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Active Stream' })
        expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
        const conversationId = createResponse.json().id

        // Set status to STREAMING with a recent updated timestamp (default behavior)
        await db.update('chat_conversation', conversationId, {
            status: ChatConversationStatus.STREAMING,
        })

        // Should stay STREAMING because updated is recent
        const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
        expect(getResponse.statusCode).toBe(StatusCodes.OK)
        expect(getResponse.json().status).toBe(ChatConversationStatus.STREAMING)
    })

    it('auto-recovers stale STREAMING conversation to IDLE after timeout', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Will Auto-Recover' })
        const conversationId = createResponse.json().id

        // Set status to STREAMING with an old updated timestamp (simulating worker crash 5 min ago, past the 2-min threshold)
        const twentyMinutesAgo = new Date(Date.now() - 5 * 60 * 1_000).toISOString()
        await db.update('chat_conversation', conversationId, {
            status: ChatConversationStatus.STREAMING,
            updated: twentyMinutesAgo,
        })

        // GET should auto-recover to IDLE
        const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
        expect(getResponse.statusCode).toBe(StatusCodes.OK)
        expect(getResponse.json().status).toBe(ChatConversationStatus.IDLE)
    })

    it('auto-recovery persists to database so subsequent reads also see IDLE', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Persist Recovery' })
        const conversationId = createResponse.json().id

        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1_000).toISOString()
        await db.update('chat_conversation', conversationId, {
            status: ChatConversationStatus.STREAMING,
            updated: twentyMinutesAgo,
        })

        // First read triggers recovery
        await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)

        // Second read should also see IDLE (recovered status was persisted)
        const secondRead = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
        expect(secondRead.json().status).toBe(ChatConversationStatus.IDLE)
    })

    it('multiple stale conversations each auto-recover independently', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const conv1 = await ctx.post(CONVERSATIONS_URL, { title: 'Stuck 1' })
        const conv2 = await ctx.post(CONVERSATIONS_URL, { title: 'Stuck 2' })
        const id1 = conv1.json().id
        const id2 = conv2.json().id

        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1_000).toISOString()
        await db.update('chat_conversation', id1, { status: ChatConversationStatus.STREAMING, updated: twentyMinutesAgo })
        await db.update('chat_conversation', id2, { status: ChatConversationStatus.STREAMING, updated: twentyMinutesAgo })

        const get1 = await ctx.get(`${CONVERSATIONS_URL}/${id1}`)
        const get2 = await ctx.get(`${CONVERSATIONS_URL}/${id2}`)
        expect(get1.json().status).toBe(ChatConversationStatus.IDLE)
        expect(get2.json().status).toBe(ChatConversationStatus.IDLE)
    })

    it('does not auto-recover STREAMING within the timeout window', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Still Running' })
        const conversationId = createResponse.json().id

        // Set status to STREAMING updated 1 minute ago (within 2-min timeout)
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1_000).toISOString()
        await db.update('chat_conversation', conversationId, {
            status: ChatConversationStatus.STREAMING,
            updated: oneMinuteAgo,
        })

        // Should stay STREAMING — agent might still be running
        const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
        expect(getResponse.json().status).toBe(ChatConversationStatus.STREAMING)
    })

    it('IDLE and ERROR statuses are not affected by staleness check', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

        const idleConv = await ctx.post(CONVERSATIONS_URL, { title: 'Idle Old' })
        const errorConv = await ctx.post(CONVERSATIONS_URL, { title: 'Error Old' })

        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1_000).toISOString()
        await db.update('chat_conversation', idleConv.json().id, { updated: twentyMinutesAgo })
        await db.update('chat_conversation', errorConv.json().id, {
            status: ChatConversationStatus.ERROR,
            updated: twentyMinutesAgo,
        })

        const getIdle = await ctx.get(`${CONVERSATIONS_URL}/${idleConv.json().id}`)
        const getError = await ctx.get(`${CONVERSATIONS_URL}/${errorConv.json().id}`)
        expect(getIdle.json().status).toBe(ChatConversationStatus.IDLE)
        expect(getError.json().status).toBe(ChatConversationStatus.ERROR)
    })
})
