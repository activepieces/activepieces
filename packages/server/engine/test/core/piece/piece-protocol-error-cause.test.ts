import { inspect } from 'node:util'
import { formatPieceError } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { pieceProtocol } from '../../../src/lib/core/piece/piece-protocol'

async function undiciFetchFailure(): Promise<Error> {
    try {
        await fetch('http://127.0.0.1:9/nope')
        throw new Error('expected fetch to fail')
    }
    catch (error) {
        return error as Error
    }
}

function acrossBoundary(error: unknown): Error {
    return pieceProtocol.deserializeError(JSON.parse(JSON.stringify(pieceProtocol.serializeError(error))))
}

describe('piece protocol error cause', () => {
    it('carries an undici cause across the RPC boundary into the flattened message', async () => {
        const original = await undiciFetchFailure()
        expect(original.message).toBe('fetch failed')
        expect(original.cause).toBeDefined()

        const revived = acrossBoundary(original)
        expect((revived.cause as Error).message).toBe((original.cause as Error).message)

        const formatted = formatPieceError(revived, { raw: inspect(revived) })
        expect(formatted.message).not.toBe('fetch failed')
        expect(formatted.message.startsWith('fetch failed: ')).toBe(true)
    })

    it('keeps a nested cause chain and stops at the depth cap', () => {
        const deepest = new Error('deepest')
        const chained = new Error('top', { cause: new Error('middle', { cause: new Error('inner', { cause: deepest }) }) })

        const revived = acrossBoundary(chained)
        const messages: string[] = []
        for (let current: unknown = revived; current instanceof Error; current = current.cause) {
            messages.push(current.message)
        }
        expect(messages).toEqual(['top', 'middle', 'inner', 'deepest'])

        expect(formatPieceError(revived).message).toBe('top: middle: inner: deepest')

        const tooDeep = new Error('a', { cause: new Error('b', { cause: new Error('c', { cause: new Error('d', { cause: new Error('e') }) }) }) })
        expect(formatPieceError(tooDeep).message).toBe('a: b: c: d')
    })

    it('surfaces a syscall code and leaves errors without a cause untouched', () => {
        const withCode = Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:443'), { code: 'ECONNREFUSED' })
        expect(formatPieceError(new Error('boom', { cause: withCode })).message).toBe('boom: connect ECONNREFUSED 10.0.0.1:443')

        expect(formatPieceError(new Error('plain')).message).toBe('plain')
        expect(acrossBoundary(new Error('plain')).cause).toBeUndefined()
    })

    it('prefers an HTTP API message over the cause chain', () => {
        const httpError = Object.assign(new Error('Request failed', { cause: new Error('socket hang up') }), {
            response: { status: 403, body: { message: 'Insufficient permissions' } },
        })
        expect(formatPieceError(httpError).message).toBe('Insufficient permissions')
    })
})
