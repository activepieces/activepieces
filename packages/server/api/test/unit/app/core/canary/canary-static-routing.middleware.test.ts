import { EventEmitter } from 'node:events'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSystemGet, mockIsValidHeader } = vi.hoisted(() => ({
    mockSystemGet: vi.fn(),
    mockIsValidHeader: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: (...args: unknown[]) => mockSystemGet(...args),
    },
}))

vi.mock('../../../../../src/app/core/canary/canary-cookie', () => ({
    canaryCookie: {
        isValidHeader: (...args: unknown[]) => mockIsValidHeader(...args),
    },
    CANARY_COOKIE_NAME: 'ap_canary',
}))

import { canaryStaticRoutingMiddleware } from '../../../../../src/app/core/canary/canary-static-routing.middleware'
import { AppSystemProp } from '../../../../../src/app/helper/system/system-props'

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    fatal: vi.fn(), trace: vi.fn(), child: vi.fn(),
} as unknown as FastifyBaseLogger

function makeRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
    return {
        method: 'GET',
        url: '/',
        headers: {},
        log: mockLog,
        server: {},
        ...overrides,
    } as unknown as FastifyRequest
}

function makeReply(): FastifyReply {
    const rawEmitter = new EventEmitter()
    const reply: Record<string, unknown> = { raw: rawEmitter, send: vi.fn() }
    reply.from = vi.fn().mockImplementation(() => {
        Promise.resolve().then(() => rawEmitter.emit('finish'))
        return reply
    })
    return reply as unknown as FastifyReply
}

describe('canaryStaticRoutingMiddleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSystemGet.mockImplementation((prop: AppSystemProp) =>
            prop === AppSystemProp.CANARY_APP_URL ? 'http://canary:3000' : undefined,
        )
        mockIsValidHeader.mockReturnValue(true)
    })

    it.each(['/', '/index.html', '/assets/index-abc.js', '/flows', '/projects/p1'])(
        'proxies frontend path %s when the canary cookie is valid',
        async (url) => {
            const reply = makeReply()
            await canaryStaticRoutingMiddleware(makeRequest({ url }), reply)
            expect(reply.from).toHaveBeenCalledWith(url, expect.objectContaining({ onError: expect.any(Function) }))
        },
    )

    it.each(['/api/v1/flows', '/mcp/x', '/ingest/e', '/.well-known/openid-configuration'])(
        'does not proxy backend path %s',
        async (url) => {
            const reply = makeReply()
            await canaryStaticRoutingMiddleware(makeRequest({ url }), reply)
            expect(reply.from).not.toHaveBeenCalled()
        },
    )

    it('does not proxy websocket upgrades', async () => {
        const reply = makeReply()
        await canaryStaticRoutingMiddleware(makeRequest({ headers: { upgrade: 'websocket' } }), reply)
        expect(reply.from).not.toHaveBeenCalled()
    })

    it('does not proxy when the canary cookie is missing or invalid', async () => {
        mockIsValidHeader.mockReturnValue(false)
        const reply = makeReply()
        await canaryStaticRoutingMiddleware(makeRequest({ url: '/flows' }), reply)
        expect(reply.from).not.toHaveBeenCalled()
    })

    it('does not proxy when CANARY_APP_URL is not configured', async () => {
        mockSystemGet.mockReturnValue(undefined)
        const reply = makeReply()
        await canaryStaticRoutingMiddleware(makeRequest({ url: '/flows' }), reply)
        expect(reply.from).not.toHaveBeenCalled()
    })
})
