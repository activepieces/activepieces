import { ActivepiecesError, apId, ErrorCode } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { ACTION_RUN_CODE_DIR } from '../../../src/lib/cache/cache-paths'
import { assertSafeCodeNamespace, assertSafePathSegment } from '../../../src/lib/utils/path-safety'

function validationErrorFrom(run: () => void): ActivepiecesError | null {
    try {
        run()
        return null
    }
    catch (error) {
        return error instanceof ActivepiecesError ? error : null
    }
}

describe('assertSafeCodeNamespace', () => {
    it('accepts a flow-version namespace, which is a single segment', () => {
        expect(() => assertSafeCodeNamespace(apId())).not.toThrow()
        expect(() => assertSafeCodeNamespace('fv-1')).not.toThrow()
    })

    it('accepts an action-run namespace, which is two segments', () => {
        expect(() => assertSafeCodeNamespace(`${ACTION_RUN_CODE_DIR}/${apId()}_${'a'.repeat(64)}`)).not.toThrow()
    })

    it('rejects a third segment, so the cache can never grow a level nobody sweeps', () => {
        const error = validationErrorFrom(() => assertSafeCodeNamespace(`${ACTION_RUN_CODE_DIR}/${apId()}/${'a'.repeat(64)}`))

        expect(error?.error.code).toBe(ErrorCode.VALIDATION)
        expect(error?.error.params).toMatchObject({ message: expect.stringContaining('exceeds') })
    })

    it('rejects traversal in either segment', () => {
        expect(() => assertSafeCodeNamespace('..')).toThrow(ActivepiecesError)
        expect(() => assertSafeCodeNamespace('../etc')).toThrow(ActivepiecesError)
        expect(() => assertSafeCodeNamespace(`${ACTION_RUN_CODE_DIR}/..`)).toThrow(ActivepiecesError)
        expect(() => assertSafeCodeNamespace('..%2f/etc')).toThrow(ActivepiecesError)
    })

    it('rejects the empty segment a leading, trailing, or doubled slash produces', () => {
        expect(() => assertSafeCodeNamespace('')).toThrow(ActivepiecesError)
        expect(() => assertSafeCodeNamespace('/a')).toThrow(ActivepiecesError)
        expect(() => assertSafeCodeNamespace('a/')).toThrow(ActivepiecesError)
        expect(() => assertSafeCodeNamespace('a//b')).toThrow(ActivepiecesError)
    })

    it('rejects a backslash and a NUL byte in either segment', () => {
        expect(() => assertSafeCodeNamespace('a\\b')).toThrow(ActivepiecesError)
        expect(() => assertSafeCodeNamespace(`${ACTION_RUN_CODE_DIR}/a\0b`)).toThrow(ActivepiecesError)
    })
})

describe('assertSafePathSegment', () => {
    it('still rejects a slash, so a step name can never become a nested path', () => {
        const error = validationErrorFrom(() => assertSafePathSegment('step/1', 'stepName'))

        expect(error?.error.code).toBe(ErrorCode.VALIDATION)
        expect(error?.error.params).toMatchObject({ message: expect.stringContaining('stepName') })
    })
})
