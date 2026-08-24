import { createNotifyServer } from '../../../src/lib/engine/rpc'

type Listener = (...args: unknown[]) => void

function createFakeSocket() {
    const listeners: Record<string, Listener> = {}
    return {
        emit: () => undefined,
        on: (event: string, listener: Listener) => {
            listeners[event] = listener
        },
        timeout: () => ({ emitWithAck: async () => undefined }),
        receive: (event: string, ...args: unknown[]) => listeners[event]?.(...args),
    }
}

describe('createNotifyServer', () => {
    it('dispatches a known method to its handler', () => {
        const socket = createFakeSocket()
        const received: unknown[] = []
        createNotifyServer(socket, { stdout: (input: unknown) => received.push(input) })
        socket.receive('rpc-notify', { method: 'stdout', payload: { message: 'hi' } })
        expect(received).toEqual([{ message: 'hi' }])
    })

    it('ignores an unknown method instead of throwing', () => {
        const socket = createFakeSocket()
        const logged: unknown[] = []
        createNotifyServer(socket, { stdout: () => undefined }, { error: (obj) => logged.push(obj) })
        expect(() => socket.receive('rpc-notify', { method: 'not-a-real-method', payload: {} })).not.toThrow()
        expect(logged).toEqual([{ rpc: { method: 'not-a-real-method' } }])
    })

    it('ignores a malformed message instead of throwing', () => {
        const socket = createFakeSocket()
        createNotifyServer(socket, { stdout: () => undefined })
        expect(() => socket.receive('rpc-notify', null)).not.toThrow()
        expect(() => socket.receive('rpc-notify', undefined)).not.toThrow()
        expect(() => socket.receive('rpc-notify', { payload: {} })).not.toThrow()
    })
})
