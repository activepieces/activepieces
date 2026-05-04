import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { FastifyInstance } from 'fastify'
import { DefaultProjectRole } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const CONVERSATIONS_URL = '/v1/chat/conversations'

describe('Chat Conversations API', () => {
    describe('Create conversation', () => {
        it('creates a conversation with title and returns platformId and userId, projectId is null', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const response = await ctx.post(CONVERSATIONS_URL, { title: 'My First Chat', modelName: 'gpt-4o' })

            expect(response.statusCode).toBe(StatusCodes.CREATED)
            const body = response.json()
            expect(body.title).toBe('My First Chat')
            expect(body.modelName).toBe('gpt-4o')
            expect(body.platformId).toBe(ctx.platform.id)
            expect(body.userId).toBe(ctx.user.id)
            expect(body.projectId).toBeNull()
            expect(body.id).toBeDefined()
        })

        it('creates a conversation with no body and returns defaults', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const response = await ctx.post(CONVERSATIONS_URL, {})

            expect(response.statusCode).toBe(StatusCodes.CREATED)
            const body = response.json()
            expect(body.title).toBeNull()
            expect(body.modelName).toBeNull()
            expect(body.projectId).toBeNull()
        })
    })

    describe('List conversations', () => {
        it('returns only conversations belonging to the current user on their platform', async () => {
            const ctxA = await createTestContext(app, { plan: { chatEnabled: true } })
            const ctxB = await createTestContext(app, { plan: { chatEnabled: true } })

            await ctxA.post(CONVERSATIONS_URL, { title: 'User A Chat 1' })
            await ctxA.post(CONVERSATIONS_URL, { title: 'User A Chat 2' })
            await ctxB.post(CONVERSATIONS_URL, { title: 'User B Chat' })

            const response = await ctxA.get(CONVERSATIONS_URL)

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.data).toHaveLength(2)
            expect(body.data.every((c: { userId: string }) => c.userId === ctxA.user.id)).toBe(true)
            expect(body.data.every((c: { platformId: string }) => c.platformId === ctxA.platform.id)).toBe(true)
        })

        it('does not return conversations from another user on the same platform', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

            await ctx.post(CONVERSATIONS_URL, { title: 'Owner Chat' })
            await memberCtx.post(CONVERSATIONS_URL, { title: 'Member Chat' })

            const ownerResponse = await ctx.get(CONVERSATIONS_URL)
            expect(ownerResponse.statusCode).toBe(StatusCodes.OK)
            const ownerBody = ownerResponse.json()
            expect(ownerBody.data.every((c: { userId: string }) => c.userId === ctx.user.id)).toBe(true)

            const memberResponse = await memberCtx.get(CONVERSATIONS_URL)
            expect(memberResponse.statusCode).toBe(StatusCodes.OK)
            const memberBody = memberResponse.json()
            expect(memberBody.data.every((c: { userId: string }) => c.userId === memberCtx.user.id)).toBe(true)
        })
    })

    describe('Cross-user isolation', () => {
        it('user B cannot GET a conversation created by user A on the same platform', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Private Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const getResponse = await memberCtx.get(`${CONVERSATIONS_URL}/${conversationId}`)
            expect(getResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('user B cannot UPDATE a conversation created by user A on the same platform', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Owner Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const updateResponse = await memberCtx.post(`${CONVERSATIONS_URL}/${conversationId}`, { title: 'Hijacked Title' })
            expect(updateResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('user B cannot DELETE a conversation created by user A on the same platform', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Protected Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const deleteResponse = await memberCtx.delete(`${CONVERSATIONS_URL}/${conversationId}`)
            expect(deleteResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('Cross-platform isolation', () => {
        it('user on platform B cannot GET a conversation created by user on platform A', async () => {
            const ctxA = await createTestContext(app, { plan: { chatEnabled: true } })
            const ctxB = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctxA.post(CONVERSATIONS_URL, { title: 'Platform A Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const getResponse = await ctxB.get(`${CONVERSATIONS_URL}/${conversationId}`)
            expect(getResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('user on platform B cannot UPDATE a conversation from platform A', async () => {
            const ctxA = await createTestContext(app, { plan: { chatEnabled: true } })
            const ctxB = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctxA.post(CONVERSATIONS_URL, { title: 'Platform A Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const updateResponse = await ctxB.post(`${CONVERSATIONS_URL}/${conversationId}`, { title: 'Cross-platform hijack' })
            expect(updateResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('user on platform B cannot DELETE a conversation from platform A', async () => {
            const ctxA = await createTestContext(app, { plan: { chatEnabled: true } })
            const ctxB = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctxA.post(CONVERSATIONS_URL, { title: 'Platform A Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const deleteResponse = await ctxB.delete(`${CONVERSATIONS_URL}/${conversationId}`)
            expect(deleteResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('Get conversation', () => {
        it('returns 404 for a non-existent conversation', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const response = await ctx.get(`${CONVERSATIONS_URL}/non-existent-id`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('returns the conversation for its owner', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Retrievable Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
            expect(getResponse.statusCode).toBe(StatusCodes.OK)
            const body = getResponse.json()
            expect(body.id).toBe(conversationId)
            expect(body.title).toBe('Retrievable Chat')
        })
    })

    describe('Update conversation', () => {
        it('updates title and modelName and verifies the changes persist', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Original Title' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const updateResponse = await ctx.post(`${CONVERSATIONS_URL}/${conversationId}`, {
                title: 'Updated Title',
                modelName: 'claude-3-5-sonnet',
            })
            expect(updateResponse.statusCode).toBe(StatusCodes.OK)
            const updated = updateResponse.json()
            expect(updated.title).toBe('Updated Title')
            expect(updated.modelName).toBe('claude-3-5-sonnet')

            const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
            expect(getResponse.statusCode).toBe(StatusCodes.OK)
            const fetched = getResponse.json()
            expect(fetched.title).toBe('Updated Title')
            expect(fetched.modelName).toBe('claude-3-5-sonnet')
        })
    })

    describe('Delete conversation', () => {
        it('deletes a conversation and subsequent GET returns 404', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'To Be Deleted' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const deleteResponse = await ctx.delete(`${CONVERSATIONS_URL}/${conversationId}`)
            expect(deleteResponse.statusCode).toBe(StatusCodes.NO_CONTENT)

            const getResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}`)
            expect(getResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('returns 404 when deleting a non-existent conversation', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const deleteResponse = await ctx.delete(`${CONVERSATIONS_URL}/non-existent-id`)
            expect(deleteResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('Get messages', () => {
        it('returns empty messages for a new conversation', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Empty Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const messagesResponse = await ctx.get(`${CONVERSATIONS_URL}/${conversationId}/messages`)
            expect(messagesResponse.statusCode).toBe(StatusCodes.OK)
            const body = messagesResponse.json()
            expect(body.data).toEqual([])
        })

        it('returns 404 for messages of a non-existent conversation', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const response = await ctx.get(`${CONVERSATIONS_URL}/non-existent-id/messages`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('Set project context', () => {
        it('sets projectId to the user\'s own project and returns the updated conversation', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Project Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const setResponse = await ctx.post(`${CONVERSATIONS_URL}/${conversationId}/project-context`, {
                projectId: ctx.project.id,
            })
            expect(setResponse.statusCode).toBe(StatusCodes.OK)
            const body = setResponse.json()
            expect(body.projectId).toBe(ctx.project.id)
        })

        it('clears projectId by setting it to null', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Project Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            await ctx.post(`${CONVERSATIONS_URL}/${conversationId}/project-context`, {
                projectId: ctx.project.id,
            })

            const clearResponse = await ctx.post(`${CONVERSATIONS_URL}/${conversationId}/project-context`, {
                projectId: null,
            })
            expect(clearResponse.statusCode).toBe(StatusCodes.OK)
            expect(clearResponse.json().projectId).toBeNull()
        })

        it('rejects setting projectId to a project from another platform', async () => {
            const ctxA = await createTestContext(app, { plan: { chatEnabled: true } })
            const ctxB = await createTestContext(app, { plan: { chatEnabled: true } })

            const createResponse = await ctxA.post(CONVERSATIONS_URL, { title: 'My Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            // User A tries to associate a project that belongs to platform B
            const setResponse = await ctxA.post(`${CONVERSATIONS_URL}/${conversationId}/project-context`, {
                projectId: ctxB.project.id,
            })
            expect(setResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('returns 404 when setting project context on a conversation owned by another user', async () => {
            const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
            const memberCtx = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const createResponse = await ctx.post(CONVERSATIONS_URL, { title: 'Owner Chat' })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const conversationId = createResponse.json().id

            const setResponse = await memberCtx.post(`${CONVERSATIONS_URL}/${conversationId}/project-context`, {
                projectId: ctx.project.id,
            })
            expect(setResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})
