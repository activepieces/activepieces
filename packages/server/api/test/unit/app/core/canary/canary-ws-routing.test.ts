import { EventEmitter } from 'node:events'
import { FastifyInstance } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSystemGet, mockIsValidHeader, mockHttpRequest, mockHttpsRequest } = vi.hoisted(() => ({
    mockSystemGet: vi.fn(),
    mockIsValidHeader: vi.fn(),
    mockHttpRequest: vi.fn(),
    mockHttpsRequest: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: { get: (...args: unknown[]) => mockSystemGet(...args) },
}))

vi.mock('../../../../../src/app/core/canary/canary-cookie', () => ({
    canaryCookie: { isValidHeader: (...args: unknown[]) => mockIsValidHeader(...args) },
    CANARY_COOKIE_NAME: 'ap_canary',
}))

vi.mock('node:http', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:http')>()
    return { ...actual, default: { ...actual.default, request: mockHttpRequest } }
})
vi.mock('node:https', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:https')>()
    return { ...actual, default: { ...actual.default, request: mockHttpsRequest } }
})

import { canaryWsRouting } from '../../../../../src/app/core/canary/canary-ws-routing'
import { AppSystemProp } from '../../../../../src/app/helper/system/system-props'

const fakeApp = { log: { error: vi.fn() } } as unknown as FastifyInstance

describe('canaryWsRouting.shouldProxy', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsValidHeader.mockReturnValue(true)
    })

    it('proxies a valid-cookie /api/socket.io upgrade', () => {
        expect(canaryWsRouting.shouldProxy({ app: fakeApp, url: '/api/socket.io/?EIO=4', cookieHeader: 'ap_canary=x' })).toBe(true)
    })

    it('does not proxy a non-socket.io url', () => {
        expect(canaryWsRouting.shouldProxy({ app: fakeApp, url: '/api/v1/flows', cookieHeader: 'ap_canary=x' })).toBe(false)
    })

    it('does not proxy an undefined url', () => {
        expect(canaryWsRouting.shouldProxy({ app: fakeApp, url: undefined, cookieHeader: 'ap_canary=x' })).toBe(false)
    })

    it('does not proxy when the cookie is invalid', () => {
        mockIsValidHeader.mockReturnValue(false)
        expect(canaryWsRouting.shouldProxy({ app: fakeApp, url: '/api/socket.io/', cookieHeader: 'ap_canary=bad' })).toBe(false)
    })
})

describe('canaryWsRouting.install', () => {
    let server: EventEmitter & { listeners: typeof EventEmitter.prototype.listeners }
    let socketIoListener: ReturnType<typeof vi.fn>
    let app: FastifyInstance

    beforeEach(() => {
        vi.clearAllMocks()
        mockSystemGet.mockImplementation((prop: AppSystemProp) =>
            prop === AppSystemProp.CANARY_APP_URL ? 'http://canary:3000' : undefined,
        )
        mockHttpRequest.mockReturnValue(Object.assign(new EventEmitter(), { end: vi.fn(), write: vi.fn() }))
        server = new EventEmitter() as never
        socketIoListener = vi.fn()
        server.on('upgrade', socketIoListener)
        app = { server, log: { error: vi.fn(), info: vi.fn() } } as unknown as FastifyInstance
    })

    it('is a no-op when CANARY_APP_URL is unset', () => {
        mockSystemGet.mockReturnValue(undefined)
        canaryWsRouting.install(app)
        server.emit('upgrade', { url: '/api/socket.io/', headers: {} }, mockSocket(), Buffer.alloc(0))
        expect(socketIoListener).toHaveBeenCalledTimes(1)
    })

    it('delegates non-canary upgrades to the captured socket.io listener', () => {
        mockIsValidHeader.mockReturnValue(false)
        canaryWsRouting.install(app)
        const req = { url: '/api/socket.io/', headers: {} }
        const socket = mockSocket()
        const head = Buffer.alloc(0)
        server.emit('upgrade', req, socket, head)
        expect(socketIoListener).toHaveBeenCalledWith(req, socket, head)
        expect(mockHttpRequest).not.toHaveBeenCalled()
    })

    it('proxies canary upgrades to the canary app and does not delegate to socket.io', () => {
        mockIsValidHeader.mockReturnValue(true)
        canaryWsRouting.install(app)
        server.emit('upgrade', { url: '/api/socket.io/?EIO=4', method: 'GET', headers: { cookie: 'ap_canary=x' } }, mockSocket(), Buffer.alloc(0))
        expect(socketIoListener).not.toHaveBeenCalled()
        expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({ hostname: 'canary', path: '/api/socket.io/?EIO=4' }))
    })

    it('destroys the upstream request (not just the client) on upstream timeout', () => {
        mockIsValidHeader.mockReturnValue(true)
        const proxyReq = Object.assign(new EventEmitter(), { end: vi.fn(), write: vi.fn(), destroy: vi.fn() })
        mockHttpRequest.mockReturnValue(proxyReq)
        canaryWsRouting.install(app)
        const clientSocket = mockSocket()
        server.emit('upgrade', { url: '/api/socket.io/', method: 'GET', headers: { cookie: 'ap_canary=x' } }, clientSocket, Buffer.alloc(0))
        proxyReq.emit('timeout')
        expect(proxyReq.destroy).toHaveBeenCalled()
        expect(clientSocket.destroy).toHaveBeenCalled()
    })
})

function mockSocket(): EventEmitter & { write: () => void, destroy: () => void, pipe: () => void } {
    return Object.assign(new EventEmitter(), { write: vi.fn(), destroy: vi.fn(), pipe: vi.fn() }) as never
}
