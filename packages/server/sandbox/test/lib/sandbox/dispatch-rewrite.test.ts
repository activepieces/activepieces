import { describe, it, expect } from 'vitest'
import { EngineOperation } from '@activepieces/shared'
import { sandboxRpcInternals } from '../../../src/lib/sandbox/sandbox'

const { rewriteInternalApiUrl } = sandboxRpcInternals

function op(fields: Record<string, unknown>): EngineOperation {
    return fields as unknown as EngineOperation
}

describe('rewriteInternalApiUrl (netns operation dispatch)', () => {
    it('replaces internalApiUrl with the gateway callback URL when one is set', () => {
        const rewritten = rewriteInternalApiUrl(op({ internalApiUrl: 'http://127.0.0.1:3000/api/', engineToken: 't' }), 'http://10.255.0.5:3000/api/')
        expect(rewritten).toEqual({ internalApiUrl: 'http://10.255.0.5:3000/api/', engineToken: 't' })
    })

    it('returns the operation untouched when there is no callback URL (no netns)', () => {
        const original = op({ internalApiUrl: 'http://127.0.0.1:3000/api/' })
        expect(rewriteInternalApiUrl(original, null)).toBe(original)
    })

    it('returns the operation untouched when it carries no internalApiUrl field', () => {
        const original = op({ engineToken: 't' })
        expect(rewriteInternalApiUrl(original, 'http://10.255.0.5:3000/api/')).toBe(original)
    })

    it('does not mutate the caller operation', () => {
        const original = op({ internalApiUrl: 'http://127.0.0.1:3000/api/' })
        rewriteInternalApiUrl(original, 'http://10.255.0.5:3000/api/')
        expect(original).toEqual({ internalApiUrl: 'http://127.0.0.1:3000/api/' })
    })
})
