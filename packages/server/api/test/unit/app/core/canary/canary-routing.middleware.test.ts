import { PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- mocks (must be before the import under test) ---

const mockSystemGet = vi.fn()
const mockSystemGetList = vi.fn()

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: (...args: unknown[]) => mockSystemGet(...args),
        getList: (...args: unknown[]) => mockSystemGetList(...args),
    },
}))

const mockFlowExecutionCacheGet = vi.fn()

vi.mock('../../../../../src/app/flows/flow/flow-execution-cache', () => ({
    flowExecutionCache: () => ({
        get: (...args: unknown[]) => mockFlowExecutionCacheGet(...args),
    }),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { canaryProxy } from '../../../../../src/app/core/canary/canary-routing.middleware'
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
        isMultipart: () => false,
        ...overrides,
    } as unknown as FastifyRequest
}

function makeReply(overrides: Partial<FastifyReply> = {}): FastifyReply {
    const reply = {
        sent: false,
        status: vi.fn().mockReturnThis(),
        headers: vi.fn().mockReturnThis(),
        send: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    }
    return reply as unknown as FastifyReply
}

function makeFetchResponse(status: number, headers: Record<string, string> = {}, body: string | null = null) {
    const fetchHeaders = new Headers(headers)
    return {
        status,
        headers: fetchHeaders,
        body: body ? { [Symbol.asyncIterator]: async function* () { yield Buffer.from(body) } } : null,
    }
}

// --- tests ---

describe('canaryRoutingMiddleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when CANARY_APP_URL is not set', async () => {
        mockSystemGet.mockReturnValue(undefined)
        const request = makeRequest()
        const reply = makeReply()

        await canaryProxy(request, reply).canaryRoutingMiddleware()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(reply.send).not.toHaveBeenCalled()
    })

    it('does nothing for WebSocket upgrade requests', async () => {
        mockSystemGet.mockReturnValue('http://canary:3000')
        const request = makeRequest({ headers: { upgrade: 'websocket' } })
        const reply = makeReply()

        await canaryProxy(request, reply).canaryRoutingMiddleware()

        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does nothing when platform ID cannot be resolved', async () => {
        mockSystemGet.mockReturnValue('http://canary:3000')
        const request = makeRequest({ params: {}, principal: undefined })
        const reply = makeReply()

        await canaryProxy(request, reply).canaryRoutingMiddleware()

        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does nothing when platform is not in canary list', async () => {
        mockSystemGet.mockReturnValue('http://canary:3000')
        mockSystemGetList.mockReturnValue(['other-platform'])
        const request = makeRequest({
            principal: { type: PrincipalType.USER, platform: { id: 'platform-abc' } } as never,
        })
        const reply = makeReply()

        await canaryProxy(request, reply).canaryRoutingMiddleware()

        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('proxies request for a canary platform resolved from principal', async () => {
        mockSystemGet.mockImplementation((prop: AppSystemProp) =>
            prop === AppSystemProp.CANARY_APP_URL ? 'http://canary:3000' : undefined,
        )
        mockSystemGetList.mockReturnValue(['platform-abc'])
        mockFetch.mockResolvedValue(makeFetchResponse(200, { 'content-type': 'application/json' }, null))

        const request = makeRequest({
            method: 'GET',
            url: '/v1/flows',
            principal: { type: PrincipalType.USER, platform: { id: 'platform-abc' } } as never,
        })
        const reply = makeReply()

        await canaryProxy(request, reply).canaryRoutingMiddleware()

        expect(mockFetch).toHaveBeenCalledWith(
            'http://canary:3000/v1/flows',
            expect.objectContaining({ method: 'GET' }),
        )
        expect(reply.status).toHaveBeenCalledWith(200)
    })

    it('proxies request for a canary platform resolved from flowId cache', async () => {
        mockSystemGet.mockImplementation((prop: AppSystemProp) =>
            prop === AppSystemProp.CANARY_APP_URL ? 'http://canary:3000' : undefined,
        )
        mockSystemGetList.mockReturnValue(['platform-xyz'])
        mockFlowExecutionCacheGet.mockResolvedValue({ exists: true, platformId: 'platform-xyz' })
        mockFetch.mockResolvedValue(makeFetchResponse(200, {}, null))

        const request = makeRequest({
            method: 'POST',
            url: '/v1/webhooks/flow-1',
            params: { flowId: 'flow-1' },
            body: { data: 'value' },
        })
        const reply = makeReply()

        await canaryProxy(request, reply).canaryRoutingMiddleware()

        expect(mockFetch).toHaveBeenCalledWith('http://canary:3000/v1/webhooks/flow-1', expect.anything())
        expect(reply.status).toHaveBeenCalledWith(200)
    })

    it('logs error and falls back when proxy fails before response is sent', async () => {
        mockSystemGet.mockReturnValue('http://canary:3000')
        mockSystemGetList.mockReturnValue(['platform-abc'])
        mockFetch.mockRejectedValue(new Error('connection refused'))

        const request = makeRequest({
            principal: { type: PrincipalType.SERVICE, platform: { id: 'platform-abc' } } as never,
        })
        const reply = makeReply({ sent: false })

        await canaryProxy(request, reply).canaryRoutingMiddleware()

        expect(mockLog.error).toHaveBeenCalledWith(
            expect.objectContaining({ err: expect.any(Error) }),
            expect.stringContaining('falling back'),
        )
        expect(reply.send).not.toHaveBeenCalled()
    })

    it('logs error without falling back when proxy fails mid-stream', async () => {
        mockSystemGet.mockReturnValue('http://canary:3000')
        mockSystemGetList.mockReturnValue(['platform-abc'])
        mockFetch.mockRejectedValue(new Error('stream broken'))

        const request = makeRequest({
            principal: { type: PrincipalType.USER, platform: { id: 'platform-abc' } } as never,
        })
        const reply = makeReply({ sent: true })

        await canaryProxy(request, reply).canaryRoutingMiddleware()

        expect(mockLog.error).toHaveBeenCalledWith(
            expect.objectContaining({ err: expect.any(Error) }),
            expect.stringContaining('mid-stream'),
        )
    })
})

describe('canaryProxy().buildProxyHeaders', () => {
    it('strips hop-by-hop headers', () => {
        const request = makeRequest({
            headers: {
                'content-type': 'application/json',
                'authorization': 'Bearer token',
                'connection': 'keep-alive',
                'content-length': '42',
                'transfer-encoding': 'chunked',
                'host': 'prod.example.com',
            },
        })

        const result = canaryProxy(request, makeReply()).buildProxyHeaders(false)

        expect(result['content-type']).toBe('application/json')
        expect(result['authorization']).toBe('Bearer token')
        expect(result['connection']).toBeUndefined()
        expect(result['content-length']).toBeUndefined()
        expect(result['transfer-encoding']).toBeUndefined()
        expect(result['host']).toBeUndefined()
    })

    it('strips content-type when body is FormData so fetch sets correct boundary', () => {
        const request = makeRequest({
            headers: {
                'content-type': 'multipart/form-data; boundary=abc123',
                'authorization': 'Bearer token',
            },
        })

        const result = canaryProxy(request, makeReply()).buildProxyHeaders(true)

        expect(result['content-type']).toBeUndefined()
        expect(result['authorization']).toBe('Bearer token')
    })

    it('joins array header values with comma', () => {
        const request = makeRequest({ headers: { 'accept': ['text/html', 'application/json'] as unknown as string } })

        const result = canaryProxy(request, makeReply()).buildProxyHeaders(false)

        expect(result['accept']).toBe('text/html, application/json')
    })

    it('drops headers with undefined values', () => {
        const request = makeRequest({ headers: { 'x-custom': undefined } })

        const result = canaryProxy(request, makeReply()).buildProxyHeaders(false)

        expect(result['x-custom']).toBeUndefined()
    })
})

describe('canaryProxy().buildProxyBody', () => {
    it('returns null for GET', () => {
        const request = makeRequest({ method: 'GET' })
        expect(canaryProxy(request, makeReply()).buildProxyBody()).toBeNull()
    })

    it('returns null for HEAD', () => {
        const request = makeRequest({ method: 'HEAD' })
        expect(canaryProxy(request, makeReply()).buildProxyBody()).toBeNull()
    })

    it('returns null when body is nil', () => {
        const request = makeRequest({ method: 'POST', body: null })
        expect(canaryProxy(request, makeReply()).buildProxyBody()).toBeNull()
    })

    it('returns string body as-is', () => {
        const request = makeRequest({ method: 'POST', body: 'raw text' })
        expect(canaryProxy(request, makeReply()).buildProxyBody()).toBe('raw text')
    })

    it('returns Buffer body as-is', () => {
        const buf = Buffer.from('bytes')
        const request = makeRequest({ method: 'POST', body: buf })
        expect(canaryProxy(request, makeReply()).buildProxyBody()).toBe(buf)
    })

    it('JSON-serialises object body', () => {
        const request = makeRequest({ method: 'POST', body: { key: 'value' } })
        expect(canaryProxy(request, makeReply()).buildProxyBody()).toBe('{"key":"value"}')
    })

    it('builds FormData for multipart with files and text fields', () => {
        const fileBuffer = Buffer.from('file content')
        const request = makeRequest({
            method: 'POST',
            body: {
                field: 'hello',
                upload: { type: 'file', filename: 'test.txt', data: fileBuffer, mimetype: 'text/plain' },
            },
            isMultipart: () => true,
        })

        const result = canaryProxy(request, makeReply()).buildProxyBody()

        expect(result).toBeInstanceOf(FormData)
        const fd = result as FormData
        expect(fd.get('field')).toBe('hello')
        const blob = fd.get('upload') as File
        expect(blob.name).toBe('test.txt')
        expect(blob.type).toBe('text/plain')
    })
})
