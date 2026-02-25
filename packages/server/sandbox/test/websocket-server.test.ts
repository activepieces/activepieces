import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { io, Socket as ClientSocket } from 'socket.io-client'
import { EngineSocketEvent } from '@activepieces/shared'
import { createSandboxWebsocketServer } from '../src/lib/websocket-server'
import { SandboxLogger, SandboxWebsocketServer } from '../src/lib/types'

const TEST_PORT = 19877

function createTestLogger(): SandboxLogger {
    return {
        info: () => {},
        debug: () => {},
        error: () => {},
        warn: () => {},
    }
}

function connectClient(sandboxId: string): ClientSocket {
    return io(`ws://127.0.0.1:${TEST_PORT}`, {
        path: '/worker/ws',
        auth: { sandboxId },
        autoConnect: true,
        reconnection: false,
    })
}

describe('websocket server', () => {
    let log: SandboxLogger
    let server: SandboxWebsocketServer
    const clients: ClientSocket[] = []

    beforeEach(() => {
        log = createTestLogger()
        server = createSandboxWebsocketServer()
        server.init(log, TEST_PORT)
    })

    afterEach(async () => {
        for (const client of clients) {
            client.disconnect()
        }
        clients.length = 0
        await server.shutdown()
    })

    it('should accept a client connection and report connected', async () => {
        const client = connectClient('ws-test-1')
        clients.push(client)

        await server.waitForConnection('ws-test-1')

        expect(server.isConnected('ws-test-1')).toBe(true)
    })

    it('should send an operation to the connected client', async () => {
        const client = connectClient('ws-test-2')
        clients.push(client)

        await server.waitForConnection('ws-test-2')

        const received = new Promise<{ operation: unknown, operationType: string }>((resolve) => {
            client.on(EngineSocketEvent.ENGINE_OPERATION, (data: { operation: unknown, operationType: string }) => {
                resolve(data)
            })
        })

        const testOperation = { platformId: 'test' }
        server.send('ws-test-2', testOperation as never, 'EXECUTE_FLOW' as never)

        const data = await received
        expect(data.operationType).toBe('EXECUTE_FLOW')
    })

    it('should deliver command events to the attached listener', async () => {
        const client = connectClient('ws-test-3')
        clients.push(client)

        await server.waitForConnection('ws-test-3')

        const receivedEvent = new Promise<{ event: EngineSocketEvent, payload: unknown }>((resolve) => {
            server.attachListener('ws-test-3', async (event, payload) => {
                resolve({ event, payload })
            })
        })

        client.emit('command', {
            event: EngineSocketEvent.ENGINE_RESPONSE,
            payload: { status: 'OK', response: { hello: 'world' } },
        })

        const { event, payload } = await receivedEvent
        expect(event).toBe(EngineSocketEvent.ENGINE_RESPONSE)
        expect((payload as Record<string, unknown>).status).toBe('OK')
    })

    it('should report disconnected after client disconnects', async () => {
        const client = connectClient('ws-test-4')
        clients.push(client)

        await server.waitForConnection('ws-test-4')
        expect(server.isConnected('ws-test-4')).toBe(true)

        const disconnected = new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (!server.isConnected('ws-test-4')) {
                    clearInterval(interval)
                    resolve()
                }
            }, 50)
        })

        client.disconnect()
        await disconnected

        expect(server.isConnected('ws-test-4')).toBe(false)
    })

    it('should throw when sending to a disconnected sandbox', () => {
        expect(() => {
            server.send('nonexistent', {} as never, 'EXECUTE_FLOW' as never)
        }).toThrow('Socket for sandbox nonexistent is not connected')
    })
})
