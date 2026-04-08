import { PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- mocks (must be before the import under test) ---

const { mockSystemGet, mockIsCanaryPlatform } = vi.hoisted(() => ({
    mockSystemGet: vi.fn(),
    mockIsCanaryPlatform: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: (...args: unknown[]) => mockSystemGet(...args),
    },
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/worker-group.service', () => ({
    workerGroupService: () => ({
        isCanaryPlatform: mockIsCanaryPlatform,
    }),
}))

const mockFlowExecutionCacheGet = vi.fn()

vi.mock('../../../../../src/app/flows/flow/flow-execution-cache', () => ({
    flowExecutionCache: () => ({
        get: (...args: unknown[]) => mockFlowExecutionCacheGet(...args),
    }),
}))

import { canaryRoutingMiddleware } from '../../../../../src/app/core/canary/canary-routing.middleware'
import { AppSystemProp } from '../../../../../src/app/helper/system/system-props'

// --- helpers ---

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger


function makeRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
    return {
        headers: {},
        method: 'GET',
        url: '/v1/test',
        body: null,
        params: {},
        principal: undefined,
        log: mockLog,
        ...overrides,
    } as unknown as FastifyRequest
}

/**
 * Creates a mock reply whose `from()` simulates the async reply-from lifecycle:
 * - On success (default): emits 'finish' on reply.raw on the next microtask tick.
 * - On error: calls `onError` and then emits 'finish' on the next microtask tick.
 *
 * This is needed because `awaitProxy` wraps `reply.from()` in a Promise that
 * only resolves once reply.raw emits 'finish'.
 */
function makeReply(opts: { sent?: boolean, proxyError?: Error } = {}): FastifyReply {
    const { sent = false, proxyError } = opts
    const rawEmitter = new EventEmitter()

    const reply: Record<string, unknown> = {
        sent,
        raw: rawEmitter,
        status: vi.fn().mockReturnThis(),
        headers: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnValue(undefined),
    }

    reply.from = vi.fn().mockImplementation(
        (_url: string, fromOpts: { onError?: Function }) => {
            if (proxyError) {
                Promise.resolve().then(() => {
                    fromOpts?.onError?.(reply, { error: proxyError })
                    rawEmitter.emit('finish')
                })
            }
            else {
                Promise.resolve().then(() => rawEmitter.emit('finish'))
            }
            return reply
        },
    )

    return reply as unknown as FastifyReply
}

// --- tests ---

describe('canaryRoutingMiddleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsCanaryPlatform.mockResolvedValue(false)
    })

    it('does nothing when CANARY_APP_URL is not set', async () => {
        mockSystemGet.mockReturnValue(undefined)
        const request = makeRequest()
        const reply = makeReply()

        await canaryRoutingMiddleware(request, reply)

        expect(reply.from).not.toHaveBeenCalled()
    })

    it('does nothing for WebSocket upgrade requests', async () => {
        mockSystemGet.mockReturnValue('http://canary:3000')
        const request = makeRequest({ headers: { upgrade: 'websocket' } })
        const reply = makeReply()

        await canaryRoutingMiddleware(request, reply)

        expect(reply.from).not.toHaveBeenCalled()
    })

    it('does nothing when platform ID cannot be resolved', async () => {
        mockSystemGet.mockReturnValue('http://canary:3000')
        mockIsCanaryPlatform.mockResolvedValue(true)
        const request = makeRequest({ params: {}, principal: undefined })
        const reply = makeReply()

        await canaryRoutingMiddleware(request, reply)

        expect(reply.from).not.toHaveBeenCalled()
    })

    it('does nothing when platform is not in canary list', async () => {
        mockSystemGet.mockReturnValue('http://canary:3000')
        mockIsCanaryPlatform.mockResolvedValue(false)
        const request = makeRequest({
            principal: { type: PrincipalType.USER, platform: { id: 'platform-abc' } } as never,
        })
        const reply = makeReply()

        await canaryRoutingMiddleware(request, reply)

        expect(reply.from).not.toHaveBeenCalled()
    })

    it('proxies request for a canary platform resolved from principal', async () => {
        mockSystemGet.mockImplementation((prop: AppSystemProp) =>
            prop === AppSystemProp.CANARY_APP_URL ? 'http://canary:3000' : undefined,
        )
        mockIsCanaryPlatform.mockResolvedValue(true)

        const request = makeRequest({
            method: 'GET',
            url: '/v1/flows',
            principal: { type: PrincipalType.USER, platform: { id: 'platform-abc' } } as never,
        })
        const reply = makeReply()

        await canaryRoutingMiddleware(request, reply)

        expect(reply.from).toHaveBeenCalledWith(
            '/v1/flows',
            expect.objectContaining({ onError: expect.any(Function) }),
        )
    })

    it('proxies request for a canary platform resolved from flowId cache', async () => {
        mockSystemGet.mockImplementation((prop: AppSystemProp) =>
            prop === AppSystemProp.CANARY_APP_URL ? 'http://canary:3000' : undefined,
        )
        mockIsCanaryPlatform.mockResolvedValue(true)
        mockFlowExecutionCacheGet.mockResolvedValue({ exists: true, platformId: 'platform-xyz' })

        const request = makeRequest({
            method: 'POST',
            url: '/v1/webhooks/flow-1',
            params: { flowId: 'flow-1' },
        })
        const reply = makeReply()

        await canaryRoutingMiddleware(request, reply)

        expect(reply.from).toHaveBeenCalledWith('/v1/webhooks/flow-1', expect.anything())
    })
})
