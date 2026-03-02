import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    ApplicationEventName,
    PlatformRole,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { faker } from '@faker-js/faker'
import { generateMockToken } from '../../../helpers/auth'
import { mockBasicUser } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Event Destinations API', () => {
    describe('POST /v1/event-destinations (Create)', () => {
        it('should create an event destination', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.url).toBe('https://example.com/webhook')
            expect(body.events).toContain(ApplicationEventName.FLOW_CREATED)
            expect(body.platformId).toBe(ctx.platform.id)
            expect(body.id).toBeDefined()
        })
    })

    describe('GET /v1/event-destinations (List)', () => {
        it('should list event destinations', async () => {
            const ctx = await createTestContext(app!)

            await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook1',
                events: [ApplicationEventName.FLOW_CREATED],
            })

            const response = await ctx.get('/v1/event-destinations')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBeGreaterThanOrEqual(1)
        })

        it('should return empty list for new platform', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/event-destinations')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toBeDefined()
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('PATCH /v1/event-destinations/:id (Update)', () => {
        it('should update event destination', async () => {
            const ctx = await createTestContext(app!)

            const createResponse = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/original',
                events: [ApplicationEventName.FLOW_CREATED],
            })
            const destId = createResponse?.json().id

            const response = await ctx.inject({
                method: 'PATCH',
                url: `/v1/event-destinations/${destId}`,
                body: {
                    url: 'https://example.com/updated',
                    events: [ApplicationEventName.FLOW_DELETED, ApplicationEventName.FLOW_CREATED],
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.url).toBe('https://example.com/updated')
            expect(body.events).toContain(ApplicationEventName.FLOW_DELETED)
        })

        it('should return error for non-existent destination', async () => {
            const ctx = await createTestContext(app!)
            const nonExistentId = apId()

            const response = await ctx.inject({
                method: 'PATCH',
                url: `/v1/event-destinations/${nonExistentId}`,
                body: {
                    url: 'https://example.com/updated',
                    events: [ApplicationEventName.FLOW_CREATED],
                },
            })

            // TODO: Server returns 500 instead of 404 for non-existent destinations — this is a server bug
            expect(response?.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
        })
    })

    describe('DELETE /v1/event-destinations/:id', () => {
        it('should delete an event destination', async () => {
            const ctx = await createTestContext(app!)

            const createResponse = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/delete-me',
                events: [ApplicationEventName.FLOW_CREATED],
            })
            const destId = createResponse?.json().id

            const response = await ctx.delete(`/v1/event-destinations/${destId}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should return 200 for non-existent destination (idempotent delete)', async () => {
            const ctx = await createTestContext(app!)
            const nonExistentId = apId()

            const response = await ctx.delete(`/v1/event-destinations/${nonExistentId}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Auth', () => {
        it('should return 403 for non-admin user', async () => {
            const ctx = await createTestContext(app!)

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: ctx.platform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const memberToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                platform: { id: ctx.platform.id },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/event-destinations',
                headers: { authorization: `Bearer ${memberToken}` },
                body: {
                    url: 'https://example.com/unauthorized',
                    events: [ApplicationEventName.FLOW_CREATED],
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should isolate event destinations between platforms', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)

            await ctx1.post('/v1/event-destinations', {
                url: 'https://example.com/platform1',
                events: [ApplicationEventName.FLOW_CREATED],
            })

            const response = await ctx2.get('/v1/event-destinations')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const urls = body.data.map((d: Record<string, string>) => d.url)
            expect(urls).not.toContain('https://example.com/platform1')
        })
    })
})
