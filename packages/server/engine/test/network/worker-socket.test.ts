import http from 'node:http'
import { NetworkMode } from '@activepieces/shared'
import { HttpProxyAgent } from 'http-proxy-agent'
import { Server as SocketIOServer } from 'socket.io'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { workerSocket } from '../../src/lib/worker-socket'

describe('workerSocket — STRICT-mode handshake', () => {
    const originalNetworkMode = process.env['AP_NETWORK_MODE']
    const originalWsPort = process.env['AP_SANDBOX_WS_PORT']
    const originalHttpAgent = http.globalAgent

    let httpServer: http.Server
    let io: SocketIOServer
    let wsPort: number

    beforeEach(async () => {
        httpServer = http.createServer()
        io = new SocketIOServer(httpServer, { path: '/worker/ws' })
        await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', () => resolve()))
        wsPort = (httpServer.address() as { port: number }).port
    })

    afterEach(async () => {
        workerSocket.disconnect()
        http.globalAgent = originalHttpAgent
        if (originalNetworkMode === undefined) delete process.env['AP_NETWORK_MODE']
        else process.env['AP_NETWORK_MODE'] = originalNetworkMode
        if (originalWsPort === undefined) delete process.env['AP_SANDBOX_WS_PORT']
        else process.env['AP_SANDBOX_WS_PORT'] = originalWsPort
        await io.close()
        await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    })

    it('connects to the worker RPC server when ssrf-guard rebinds http.globalAgent to HttpProxyAgent', async () => {
        // Simulate STRICT-mode bootstrap: ssrf-guard swaps the global agent to
        // route piece HTTP via the egress proxy. Before the fix, socket.io-client's
        // polling transport would fall back through Node's `agent:false` path,
        // which calls `new defaultAgent.constructor(opts)` — i.e. `new HttpProxyAgent({})`
        // without a URL — and crash the handshake. The worker then logs
        // "Sandbox <id> did not connect within 30 seconds".
        process.env['AP_NETWORK_MODE'] = NetworkMode.STRICT
        process.env['AP_SANDBOX_WS_PORT'] = String(wsPort)
        http.globalAgent = new HttpProxyAgent('http://127.0.0.1:1') // unreachable proxy by design

        const connection = new Promise<string>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('sandbox did not connect')), 5_000)
            io.on('connection', (socket) => {
                clearTimeout(timer)
                resolve(socket.handshake.auth.sandboxId as string)
            })
        })

        workerSocket.init('test-sandbox')

        await expect(connection).resolves.toBe('test-sandbox')
    })

    it('does not pin an agent outside STRICT mode', async () => {
        delete process.env['AP_NETWORK_MODE']
        process.env['AP_SANDBOX_WS_PORT'] = String(wsPort)

        const connection = new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('sandbox did not connect')), 5_000)
            io.on('connection', () => {
                clearTimeout(timer)
                resolve()
            })
        })

        workerSocket.init('test-sandbox-unrestricted')

        await expect(connection).resolves.toBeUndefined()
    })
})
