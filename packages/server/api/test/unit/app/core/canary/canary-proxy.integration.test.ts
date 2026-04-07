/**
 * Integration tests for canaryRoutingMiddleware.
 *
 * Strategy:
 *  - "Canary app"  — a real Fastify server bound to an OS-assigned port.
 *                    It records every request it receives and can return a
 *                    per-test response via `canaryResponseOverride`.
 *  - "Primary app" — a minimal Fastify app that registers @fastify/reply-from
 *                    (pointed at the canary server) and the middleware as a
 *                    preHandler hook plus fallback routes. Requests are sent
 *                    via app.inject() — no real TCP listener needed on the
 *                    primary side.
 *
 * The middleware's reply.from() call goes to the real canary server over
 * localhost TCP, so the full proxy path is exercised.
 */

import { PrincipalType } from '@activepieces/shared'
import replyFrom from '@fastify/reply-from'
import fastify, { FastifyInstance, FastifyRequest } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// --- module mocks (must appear before the import under test) ---

const { mockSystemGet, mockGetCanaryPlatformIds } = vi.hoisted(() => ({
    mockSystemGet: vi.fn(),
    mockGetCanaryPlatformIds: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: (...args: unknown[]) => mockSystemGet(...args),
    },
}))

vi.mock('../../../../../src/app/core/canary/platform-canary.service', () => ({
    platformCanaryService: () => ({
        getCanaryPlatformIds: mockGetCanaryPlatformIds,
    }),
}))

vi.mock('../../../../../src/app/flows/flow/flow-execution-cache', () => ({
    flowExecutionCache: () => ({
        get: vi.fn().mockResolvedValue({ exists: false }),
    }),
}))

import { canaryRoutingMiddleware } from '../../../../../src/app/core/canary/canary-routing.middleware'

// --- canary server ---

type RecordedRequest = {
    method: string
    url: string
    headers: Record<string, string | string[] | undefined>
    body: string
}

type ResponseOverride = { status: number, body: unknown }

let canaryApp: FastifyInstance
let canaryUrl: string
const canaryRequests: RecordedRequest[] = []
let canaryResponseOverride: ResponseOverride | null = null

beforeAll(async () => {
    canaryApp = fastify()
    canaryApp.addContentTypeParser('*', { parseAs: 'string' }, (_req, body, done) => done(null, body))

    canaryApp.all('/*', async (req, reply) => {
        canaryRequests.push({
            method: req.method,
            url: req.url,
            headers: req.headers as Record<string, string | string[] | undefined>,
            body: req.body as string,
        })
        const override = canaryResponseOverride
        return override
            ? reply.status(override.status).send(override.body)
            : reply.status(200).send({ proxied: true })
    })

    await canaryApp.listen({ port: 0, host: '127.0.0.1' })
    const address = canaryApp.server.address()
    canaryUrl = `http://127.0.0.1:${(address as { port: number }).port}`
})

afterAll(async () => {
    await canaryApp.close()
})

// --- primary app ---

let primaryApp: FastifyInstance

async function buildPrimaryApp(platformId = 'canary-platform'): Promise<FastifyInstance> {
    const app = fastify()

    await app.register(replyFrom, { base: canaryUrl })

    app.addHook('onRequest', async (request: FastifyRequest) => {
        request.principal = {
            type: PrincipalType.USER,
            platform: { id: platformId },
        } as never
    })

    app.addHook('preHandler', canaryRoutingMiddleware)

    app.get('/v1/test', async () => ({ source: 'primary' }))
    app.post('/v1/test', async () => ({ source: 'primary' }))

    return app
}

beforeEach(async () => {
    vi.clearAllMocks()
    canaryRequests.length = 0
    canaryResponseOverride = null

    mockSystemGet.mockImplementation((prop: string) =>
        prop === 'CANARY_APP_URL' ? canaryUrl : undefined,
    )
    mockGetCanaryPlatformIds.mockResolvedValue(['canary-platform'])

    primaryApp = await buildPrimaryApp()
    await primaryApp.ready()
})

afterEach(async () => {
    await primaryApp.close()
})

// --- tests ---

describe('canary proxy — actual HTTP forwarding', () => {
    it('forwards GET to canary and returns its response', async () => {
        const response = await primaryApp.inject({ method: 'GET', url: '/v1/test' })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ proxied: true })
        expect(canaryRequests).toHaveLength(1)
        expect(canaryRequests[0].method).toBe('GET')
        expect(canaryRequests[0].url).toBe('/v1/test')
    })

    it('forwards POST body to canary', async () => {
        const response = await primaryApp.inject({
            method: 'POST',
            url: '/v1/test',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ key: 'value' }),
        })

        expect(response.statusCode).toBe(200)
        expect(canaryRequests).toHaveLength(1)
        expect(canaryRequests[0].body).toEqual({ key: 'value' })
    })

    it('forwards custom headers to canary', async () => {
        await primaryApp.inject({
            method: 'GET',
            url: '/v1/test',
            headers: {
                'x-custom-header': 'my-value',
                'authorization': 'Bearer secret',
            },
        })

        const received = canaryRequests[0].headers
        expect(received['x-custom-header']).toBe('my-value')
        expect(received['authorization']).toBe('Bearer secret')
    })

    it('does not forward host header to canary', async () => {
        await primaryApp.inject({
            method: 'GET',
            url: '/v1/test',
            headers: { host: 'prod.example.com', 'x-real-ip': '1.2.3.4' },
        })

        // host is rewritten by reply.from to point at canary
        expect(canaryRequests[0].headers['host']).not.toBe('prod.example.com')
        // non-hop-by-hop header is forwarded
        expect(canaryRequests[0].headers['x-real-ip']).toBe('1.2.3.4')
    })

    it('returns canary status code and body to the original caller', async () => {
        canaryResponseOverride = { status: 422, body: { error: 'invalid payload' } }

        const response = await primaryApp.inject({ method: 'GET', url: '/v1/test' })

        expect(response.statusCode).toBe(422)
        expect(response.json()).toEqual({ error: 'invalid payload' })
    })

    it('falls through to primary handler when platform is not in canary list', async () => {
        mockGetCanaryPlatformIds.mockResolvedValue(['other-platform'])

        const response = await primaryApp.inject({ method: 'GET', url: '/v1/test' })

        expect(canaryRequests).toHaveLength(0)
        expect(response.json()).toEqual({ source: 'primary' })
    })

    it('falls through to primary handler when CANARY_APP_URL is not configured', async () => {
        mockSystemGet.mockReturnValue(undefined)

        const response = await primaryApp.inject({ method: 'GET', url: '/v1/test' })

        expect(canaryRequests).toHaveLength(0)
        expect(response.json()).toEqual({ source: 'primary' })
    })

    it('falls through to primary handler for WebSocket upgrade', async () => {
        const response = await primaryApp.inject({
            method: 'GET',
            url: '/v1/test',
            headers: { upgrade: 'websocket' },
        })

        expect(canaryRequests).toHaveLength(0)
        expect(response.json()).toEqual({ source: 'primary' })
    })
})
