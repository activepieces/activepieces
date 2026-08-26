import { inspect } from 'node:util'
import { formatPieceError } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { pieceProtocol } from '../../../src/lib/core/piece/piece-protocol'

function acrossBoundary(error: unknown): Error {
    return pieceProtocol.deserializeError(JSON.parse(JSON.stringify(pieceProtocol.serializeError(error))))
}

describe('piece protocol error cause', () => {
    it('carries an undici cause across the RPC boundary into the raw payload', async () => {
        const original = await fetch('http://127.0.0.1:9/nope').catch((error: Error) => error)
        expect(original.message).toBe('fetch failed')

        const revived = acrossBoundary(original)
        const { raw, message } = formatPieceError(revived, { raw: inspect(revived) })

        expect(message).toBe('fetch failed')
        expect(raw).toContain((original.cause as Error).message)
    })

    it('leaves errors without a cause untouched', () => {
        expect(acrossBoundary(new Error('plain')).cause).toBeUndefined()
    })
})
