import { describe, it, expect } from 'vitest'
import { summarizeEngineError } from '../../../../src/lib/execute/utils/engine-error-summary'

describe('summarizeEngineError', () => {
    it('returns undefined when the engine reported no error', () => {
        expect(summarizeEngineError({ error: undefined })).toBeUndefined()
    })

    it('keeps only the name and message of a friendly piece error', () => {
        const friendlyError = JSON.stringify({
            __apErrorVersion: 1,
            message: 'Auth failed',
            errorName: 'HttpError',
            requestBody: { apiKey: 'sk-super-secret' },
        })

        expect(summarizeEngineError({ error: friendlyError })).toBe('HttpError: Auth failed')
    })

    it('caps a friendly piece error, whose message is truncated at a far larger limit upstream', () => {
        const friendlyError = JSON.stringify({
            __apErrorVersion: 1,
            message: 'x'.repeat(2000),
            errorName: 'HttpError',
        })

        expect(summarizeEngineError({ error: friendlyError })?.length).toBe(500)
    })

    it('caps a raw engine error that is not a friendly piece error', () => {
        expect(summarizeEngineError({ error: 'y'.repeat(2000) })?.length).toBe(500)
    })
})
