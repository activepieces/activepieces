import { AIProviderName, apId } from '@activepieces/core-utils'
import { DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { aiProviderHealth } from '../../../../src/app/ai/ai-provider-health'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockSendRequest } = vi.hoisted(() => ({ mockSendRequest: vi.fn() }))

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const original = await importOriginal<typeof import('@activepieces/pieces-common')>()
    return {
        ...original,
        httpClient: { ...original.httpClient, sendRequest: mockSendRequest },
    }
})

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
    mockSendRequest.mockReset()
})

// Each azure config gets its own resourceName so the model cache never serves one key's answer
// for another — the cache is keyed on the whole configuration.
async function azureKey(resourceName: string) {
    return mockAndSaveAIProvider({
        platformId: ctx.platform.id,
        provider: AIProviderName.AZURE,
        displayName: `Azure ${resourceName}`,
        config: { resourceName },
    })
}

function httpFailure(status: number, body: unknown) {
    return Object.assign(new Error(`Request failed with status code ${status}`), {
        response: { status, body },
    })
}

async function statusOf(providerId: string) {
    const row = await db.findOneByOrFail<{ status: string, statusReason: string | null, statusUpdated: string | null }>('ai_provider', { id: providerId })
    return row
}

describe('AI provider key status', () => {
    it('is active the moment it is created, because creating it proved the credentials', async () => {
        mockSendRequest.mockResolvedValue({ body: { data: [] } })

        const response = await ctx.post('/v1/ai-providers', {
            provider: AIProviderName.AZURE,
            displayName: 'Fresh azure key',
            config: { resourceName: 'fresh' },
            auth: { apiKey: 'valid-key' },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().status).toBe('active')
        const stored = await statusOf(response?.json().id)
        expect(stored.status).toBe('active')
        expect(stored.statusUpdated).not.toBeNull()
    })

    // The reported bug: a second key used to read untested while the first flipped to active, because
    // nothing recorded at creation and the list was refetched before any later call could.
    it('does not leave a second key waiting on a later call, even when it shares the first key credentials', async () => {
        mockSendRequest.mockResolvedValue({ body: { data: [] } })
        const sharedAuth = { apiKey: 'one-key-two-configs' }

        const first = await ctx.post('/v1/ai-providers', {
            provider: AIProviderName.AZURE,
            displayName: 'First',
            config: { resourceName: 'shared' },
            auth: sharedAuth,
        })
        const second = await ctx.post('/v1/ai-providers', {
            provider: AIProviderName.AZURE,
            displayName: 'Second',
            config: { resourceName: 'shared' },
            auth: sharedAuth,
        })

        // The second key's model listing is a cache hit on the first key's entry, so it reports
        // nothing — which is exactly why creation has to record instead.
        await ctx.get(`/v1/ai-providers/configs/${second.json().id}/models`)

        expect((await statusOf(first.json().id)).status).toBe('active')
        expect((await statusOf(second.json().id)).status).toBe('active')
    })

    it('leaves the status alone when a replacement key is rejected and discarded', async () => {
        const key = await azureKey('replaced')
        await db.update('ai_provider', key.id, { status: 'active' })

        mockSendRequest.mockRejectedValue(httpFailure(401, { error: { message: 'Access denied due to invalid subscription key' } }))
        const response = await ctx.post(`/v1/ai-providers/${key.id}`, {
            displayName: 'replaced',
            auth: { apiKey: 'revoked' },
        })

        expect(response?.statusCode).not.toBe(StatusCodes.OK)
        expect((await statusOf(key.id)).status).toBe('active')
    })

    it('records a replacement key that works', async () => {
        const key = await azureKey('accepted')
        await db.update('ai_provider', key.id, { status: 'rejected', statusReason: 'HTTP 401' })

        mockSendRequest.mockResolvedValue({ body: { data: [{ id: 'gpt-4o', model: 'gpt-4o', status: 'succeeded' }] } })
        const response = await ctx.post(`/v1/ai-providers/${key.id}`, {
            displayName: 'accepted',
            auth: { apiKey: 'working' },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const recorded = await statusOf(key.id)
        expect(recorded.status).toBe('active')
        expect(recorded.statusReason).toBeNull()
    })

    it('turns a rejected secret into rejected, then back to active once an admin rechecks it', async () => {
        const key = await azureKey('rotated')

        mockSendRequest.mockRejectedValueOnce(httpFailure(401, { error: { message: 'Access denied due to invalid subscription key' } }))
        await ctx.get(`/v1/ai-providers/configs/${key.id}/models`)

        const rejected = await statusOf(key.id)
        expect(rejected.status).toBe('rejected')
        expect(rejected.statusReason).toContain('401')
        expect(rejected.statusUpdated).not.toBeNull()

        mockSendRequest.mockResolvedValueOnce({ body: { data: [{ id: 'gpt-4o', model: 'gpt-4o', status: 'succeeded' }] } })
        await ctx.post(`/v1/ai-providers/${key.id}/recheck`, {})

        const recovered = await statusOf(key.id)
        expect(recovered.status).toBe('active')
        expect(recovered.statusReason).toBeNull()
    })

    it('does not let a model listing that never spent the key clear a real failure', async () => {
        const key = await azureKey('listing-proves-nothing')
        await db.update('ai_provider', key.id, { status: 'out_of_credits', statusReason: 'HTTP 429: insufficient_quota' })

        mockSendRequest.mockResolvedValue({ body: { data: [{ id: 'gpt-4o', model: 'gpt-4o', status: 'succeeded' }] } })
        await ctx.get(`/v1/ai-providers/configs/${key.id}/models`)

        const unchanged = await statusOf(key.id)
        expect(unchanged.status).toBe('out_of_credits')
        expect(unchanged.statusReason).toContain('429')
    })

    it('reads the provider billing as out of credits, not as an outage', async () => {
        const key = await azureKey('unpaid')

        mockSendRequest.mockRejectedValueOnce(httpFailure(429, {
            error: { code: 'insufficient_quota', message: 'You exceeded your current quota, please check your plan and billing details.' },
        }))
        await ctx.get(`/v1/ai-providers/configs/${key.id}/models`)

        expect((await statusOf(key.id)).status).toBe('out_of_credits')
    })

    it('leaves the status alone for a plain rate limit, because a busy key is not a sick key', async () => {
        const key = await azureKey('busy')

        mockSendRequest.mockRejectedValueOnce(httpFailure(429, {
            error: { code: 'rate_limit_exceeded', message: 'Requests to the ChatCompletions Operation have exceeded the rate limit' },
        }))
        await ctx.get(`/v1/ai-providers/configs/${key.id}/models`)

        expect((await statusOf(key.id)).status).toBe('active')
    })

    it('reads a provider outage as unreachable', async () => {
        const key = await azureKey('down')

        mockSendRequest.mockRejectedValueOnce(httpFailure(503, { error: { message: 'Service Unavailable' } }))
        await ctx.get(`/v1/ai-providers/configs/${key.id}/models`)

        expect((await statusOf(key.id)).status).toBe('unreachable')
    })

    it('does not refresh an unchanged status inside the throttle window', async () => {
        const key = await azureKey('steady')

        mockSendRequest.mockRejectedValueOnce(httpFailure(503, { error: { message: 'Service Unavailable' } }))
        await ctx.get(`/v1/ai-providers/configs/${key.id}/models`)
        const first = await statusOf(key.id)
        expect(first.status).toBe('unreachable')

        mockSendRequest.mockRejectedValueOnce(httpFailure(503, { error: { message: 'Service Unavailable' } }))
        await ctx.get(`/v1/ai-providers/configs/${key.id}/models`)
        const second = await statusOf(key.id)

        expect(second.status).toBe('unreachable')
        expect(String(second.statusUpdated)).toBe(String(first.statusUpdated))
    })

    it('keeps the newest observation, whatever order the observations arrive in', async () => {
        const key = await azureKey('raced')
        await db.update('ai_provider', key.id, { status: 'rejected', statusReason: 'HTTP 401: old failure' })
        const health = aiProviderHealth(app!.log)
        const observedAt = Date.now()

        const recovered = await health.record({
            platformId: ctx.platform.id,
            providerId: key.id,
            signal: { statusCode: 200, observedAt },
        })
        const stale = await health.record({
            platformId: ctx.platform.id,
            providerId: key.id,
            signal: { statusCode: 401, body: 'invalid api key', observedAt: observedAt - 5000 },
        })

        expect(recovered).toBe('active')
        expect(stale).toBeNull()
        const row = await statusOf(key.id)
        expect(row.status).toBe('active')
        expect(row.statusReason).toBeNull()
    })

    describe('POST /:id/recheck', () => {
        it('lets an admin ask now rather than wait for traffic', async () => {
            const key = await azureKey('recheck-me')
            await db.update('ai_provider', key.id, { status: 'rejected', statusReason: 'HTTP 401: old failure' })

            mockSendRequest.mockResolvedValue({ body: { data: [{ id: 'gpt-4o', model: 'gpt-4o', status: 'succeeded' }] } })
            const response = await ctx.post(`/v1/ai-providers/${key.id}/recheck`, {})

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().status).toBe('active')
            expect((await statusOf(key.id)).status).toBe('active')
        })

        it('forbids a non-admin member', async () => {
            const key = await azureKey('guarded')
            const memberCtx = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const response = await memberCtx.post(`/v1/ai-providers/${key.id}/recheck`, {})

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('404s for a key on another platform', async () => {
            const response = await ctx.post(`/v1/ai-providers/${apId()}/recheck`, {})

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})
