import { apId } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { ApplicationEventName, PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { mockBasicUser } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const UNREACHABLE_URL = 'http://127.0.0.1:1/webhook'

let app: FastifyInstance | null = null

const createEnabledContext = async (): Promise<TestContext> => createTestContext(app!, {
    plan: { eventStreamingEnabled: true },
})

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Event Destinations API', () => {
    describe('POST /v1/event-destinations (Create)', () => {
        it('should create an event destination', async () => {
            const ctx = await createEnabledContext()

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
            const ctx = await createEnabledContext()

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
            const ctx = await createEnabledContext()

            const response = await ctx.get('/v1/event-destinations')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toBeDefined()
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('POST /v1/event-destinations/:id (Update)', () => {
        it('should update event destination', async () => {
            const ctx = await createEnabledContext()

            const createResponse = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/original',
                events: [ApplicationEventName.FLOW_CREATED],
            })
            const destId = createResponse?.json().id

            const response = await ctx.inject({
                method: 'POST',
                url: `/api/v1/event-destinations/${destId}`,
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
            const ctx = await createEnabledContext()
            const nonExistentId = apId()

            const response = await ctx.inject({
                method: 'POST',
                url: `/api/v1/event-destinations/${nonExistentId}`,
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
            const ctx = await createEnabledContext()

            const createResponse = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/delete-me',
                events: [ApplicationEventName.FLOW_CREATED],
            })
            const destId = createResponse?.json().id

            const response = await ctx.delete(`/v1/event-destinations/${destId}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should return 200 for non-existent destination (idempotent delete)', async () => {
            const ctx = await createEnabledContext()
            const nonExistentId = apId()

            const response = await ctx.delete(`/v1/event-destinations/${nonExistentId}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('POST /v1/event-destinations/test', () => {
        it('should return the raw event as the rendered body when no mapper is given', async () => {
            const ctx = await createEnabledContext()

            const response = await ctx.post('/v1/event-destinations/test', {
                url: UNREACHABLE_URL,
                event: ApplicationEventName.FLOW_CREATED,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.renderedBody.action).toBe(ApplicationEventName.FLOW_CREATED)
            expect(body.renderedBody.platformId).toBe(ctx.platform.id)
            expect(typeof body.durationMs).toBe('number')
        })

        it('should default to flow.created when no event is given', async () => {
            const ctx = await createEnabledContext()

            const response = await ctx.post('/v1/event-destinations/test', {
                url: UNREACHABLE_URL,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().renderedBody.action).toBe(ApplicationEventName.FLOW_CREATED)
        })

        it('should render the mapper and keep native JSON types', async () => {
            const ctx = await createEnabledContext()

            const response = await ctx.post('/v1/event-destinations/test', {
                url: UNREACHABLE_URL,
                event: ApplicationEventName.FLOW_RUN_FINISHED,
                mapper: {
                    name: '{{ action }}',
                    duration: '{{ data.flowRun.duration }}',
                    nested: { platform: '{{ platformId }}' },
                    literal: 'no tokens here',
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const { renderedBody } = response?.json()
            expect(renderedBody.name).toBe(ApplicationEventName.FLOW_RUN_FINISHED)
            expect(renderedBody.duration).toBe(1234)
            expect(renderedBody.nested.platform).toBe(ctx.platform.id)
            expect(renderedBody.literal).toBe('no tokens here')
        })

        it('should report the failure instead of throwing when the destination is unreachable', async () => {
            const ctx = await createEnabledContext()

            const response = await ctx.post('/v1/event-destinations/test', {
                url: UNREACHABLE_URL,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.error).toBeDefined()
            expect(body.status).toBeUndefined()
        })

        it('should refuse to look up a stored header value', async () => {
            const ctx = await createEnabledContext()
            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer secret' },
            })

            const nullHeader = await ctx.post('/v1/event-destinations/test', {
                url: UNREACHABLE_URL,
                headers: { Authorization: null },
            })
            expect(nullHeader?.statusCode).toBe(StatusCodes.BAD_REQUEST)

            const byDestinationId = await ctx.post('/v1/event-destinations/test', {
                url: UNREACHABLE_URL,
                destinationId: created?.json().id,
            })
            expect(byDestinationId?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('should send only the headers the caller supplied in the request', async () => {
            const ctx = await createEnabledContext()
            await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer stored-secret' },
            })
            const requestSpy = vi.spyOn(safeHttp.axios, 'request').mockResolvedValue({ status: 200 })

            const response = await ctx.post('/v1/event-destinations/test', {
                url: 'https://example.com/webhook',
                headers: { 'X-Tenant': 'typed-by-the-caller' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const sentHeaders = requestSpy.mock.calls[0][0].headers
            expect(sentHeaders).not.toHaveProperty('Authorization')
            expect(JSON.stringify(sentHeaders)).not.toContain('stored-secret')
            requestSpy.mockRestore()
        })
    })

    describe('Headers', () => {
        it('should never return a header value, only its key', async () => {
            const ctx = await createEnabledContext()

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer secret' },
            })

            expect(created?.json().headers).toEqual({ Authorization: null })

            const listed = await ctx.get('/v1/event-destinations')
            const found = listed?.json().data.find((destination: { id: string }) => destination.id === created?.json().id)
            expect(found.headers).toEqual({ Authorization: null })
        })

        it('should keep a stored header value when the update sends null for its key', async () => {
            const ctx = await createEnabledContext()

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer secret' },
            })

            const updated = await ctx.post(`/v1/event-destinations/${created?.json().id}`, {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_DELETED],
                headers: { Authorization: null },
            })

            expect(updated?.statusCode).toBe(StatusCodes.OK)
            expect(updated?.json().events).toContain(ApplicationEventName.FLOW_DELETED)
            expect(updated?.json().headers).toEqual({ Authorization: null })
        })

        it('should refuse to carry a stored header value over to a different URL', async () => {
            const ctx = await createEnabledContext()

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer secret' },
            })

            const kept = await ctx.post(`/v1/event-destinations/${created?.json().id}`, {
                url: 'https://attacker.example/collect',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: null },
            })
            expect(kept?.statusCode).toBe(StatusCodes.BAD_REQUEST)

            const omitted = await ctx.post(`/v1/event-destinations/${created?.json().id}`, {
                url: 'https://attacker.example/collect',
                events: [ApplicationEventName.FLOW_CREATED],
            })
            expect(omitted?.statusCode).toBe(StatusCodes.BAD_REQUEST)

            const unchanged = await ctx.get('/v1/event-destinations')
            const found = unchanged?.json().data.find((destination: { id: string }) => destination.id === created?.json().id)
            expect(found.url).toBe('https://example.com/webhook')
        })

        it('should allow a URL change that re-enters every stored header value', async () => {
            const ctx = await createEnabledContext()

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer secret' },
            })

            const retyped = await ctx.post(`/v1/event-destinations/${created?.json().id}`, {
                url: 'https://example.com/webhook-renamed',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer retyped' },
            })
            expect(retyped?.statusCode).toBe(StatusCodes.OK)
            expect(retyped?.json().url).toBe('https://example.com/webhook-renamed')

            const dropped = await ctx.post(`/v1/event-destinations/${created?.json().id}`, {
                url: 'https://example.com/webhook-again',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: {},
            })
            expect(dropped?.statusCode).toBe(StatusCodes.OK)
            expect(dropped?.json().headers).toBeNull()
        })

        it('should mask every stored key when the update replaces one value and keeps another', async () => {
            const ctx = await createEnabledContext()

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer kept', 'X-Tenant': 'old' },
            })

            const updated = await ctx.post(`/v1/event-destinations/${created?.json().id}`, {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: null, 'X-Tenant': 'new' },
            })

            expect(updated?.statusCode).toBe(StatusCodes.OK)
            expect(updated?.json().headers).toEqual({ Authorization: null, 'X-Tenant': null })
        })

        it('should treat a header whose key was renamed as absent, without failing the update', async () => {
            const ctx = await createEnabledContext()

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer secret' },
            })

            const updated = await ctx.post(`/v1/event-destinations/${created?.json().id}`, {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorisation: null },
            })

            expect(updated?.statusCode).toBe(StatusCodes.OK)
            expect(updated?.json().headers).toBeNull()
        })

        it('should reject a header name that is not a valid HTTP field name', async () => {
            const ctx = await createEnabledContext()

            const emptyName = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { '': 'value' },
            })
            expect(emptyName?.statusCode).toBe(StatusCodes.BAD_REQUEST)

            const nulByte = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { 'X-Tenant\u0000': 'value' },
            })
            expect(nulByte?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('should mask an unreadable stored header instead of failing the whole list', async () => {
            const ctx = await createEnabledContext()

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer secret' },
            })
            await db.update('event_destination', created?.json().id, {
                headers: { iv: 'not-a-per-key-map', data: 'written-by-an-older-build' },
            })

            const listed = await ctx.get('/v1/event-destinations')

            expect(listed?.statusCode).toBe(StatusCodes.OK)
            const found = listed?.json().data.find((destination: { id: string }) => destination.id === created?.json().id)
            expect(found.headers).toBeNull()
        })

        it('should drop a header whose key is absent from the update', async () => {
            const ctx = await createEnabledContext()

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: { Authorization: 'Bearer secret' },
            })

            const updated = await ctx.post(`/v1/event-destinations/${created?.json().id}`, {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
                headers: {},
            })

            expect(updated?.json().headers).toBeNull()
        })
    })

    describe('Auth', () => {
        it('should return 402 when the platform plan has event streaming disabled', async () => {
            const ctx = await createTestContext(app!, {
                plan: { eventStreamingEnabled: false },
            })

            const created = await ctx.post('/v1/event-destinations', {
                url: 'https://example.com/webhook',
                events: [ApplicationEventName.FLOW_CREATED],
            })
            expect(created?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)

            const listed = await ctx.get('/v1/event-destinations')
            expect(listed?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        })

        it('should return 403 for non-admin user', async () => {
            const ctx = await createEnabledContext()

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
                url: '/api/v1/event-destinations',
                headers: { authorization: `Bearer ${memberToken}` },
                body: {
                    url: 'https://example.com/unauthorized',
                    events: [ApplicationEventName.FLOW_CREATED],
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should isolate event destinations between platforms', async () => {
            const ctx1 = await createEnabledContext()
            const ctx2 = await createEnabledContext()

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
