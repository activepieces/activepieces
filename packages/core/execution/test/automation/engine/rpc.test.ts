import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { apErrorOf, createRpcClient, createRpcServer } from '../../../src/lib/engine/rpc'

type TestContract = {
    boom: (input: unknown) => Promise<unknown>
}

function loopbackSocket() {
    const listeners = new Map<string, (msg: unknown, ack: (result: unknown) => void) => void>()
    return {
        emit: () => undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        on: (event: string, listener: (...args: any[]) => void) => {
            listeners.set(event, listener)
        },
        timeout: () => ({
            emitWithAck: (event: string, msg: unknown) => new Promise<unknown>((resolve) => {
                listeners.get(event)?.(msg, (result: unknown) => resolve(JSON.parse(JSON.stringify(result))))
            }),
        }),
    }
}

function clientFor(boom: () => unknown): TestContract {
    const socket = loopbackSocket()
    createRpcServer(socket, { boom })
    return createRpcClient<TestContract>(socket, 1_000)
}

describe('rpc error envelope', () => {
    it('carries the code and entity of an ActivepiecesError across the boundary', async () => {
        const client = clientFor(() => {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: 'GOOGLE', entityType: 'AIProvider' },
            }, 'the google AI provider is not configured on this platform')
        })

        const caught = await client.boom({}).catch((error: unknown) => error)

        expect(apErrorOf(caught)).toEqual({ code: ErrorCode.ENTITY_NOT_FOUND, entityType: 'AIProvider' })
        expect(caught).toBeInstanceOf(Error)
        expect(String(caught)).toContain('the google AI provider is not configured on this platform')
    })

    it('leaves a plain error with nothing to read, so callers cannot mistake it for a known code', async () => {
        const client = clientFor(() => { throw new Error('Cannot read properties of undefined') })

        const caught = await client.boom({}).catch((error: unknown) => error)

        expect(apErrorOf(caught)).toBeUndefined()
        expect(String(caught)).toContain('Cannot read properties of undefined')
    })

    it('drops a params object that could not survive the JSON ack', async () => {
        const cyclic: Record<string, unknown> = { entityType: 'AIProvider' }
        cyclic['self'] = cyclic
        const client = clientFor(() => {
            throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: cyclic })
        })

        const caught = await client.boom({}).catch((error: unknown) => error)

        expect(apErrorOf(caught)).toEqual({ code: ErrorCode.ENTITY_NOT_FOUND, entityType: 'AIProvider' })
    })
})
