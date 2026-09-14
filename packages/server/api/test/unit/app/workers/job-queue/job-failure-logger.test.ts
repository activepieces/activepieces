import { describe, expect, it } from 'vitest'
import { jobFailureLogger } from '../../../../../src/app/workers/job-queue/job-failure-logger'

describe('jobFailureLogger.signatureOf', () => {
    it('groups two failures thrown at the same site under the same signature', () => {
        function throwAtFixedLine(): never {
            throw new Error('same call site')
        }
        let sigA = ''
        let sigB = ''
        try { throwAtFixedLine() }
        catch (e) { sigA = jobFailureLogger.signatureOf(e) }
        try { throwAtFixedLine() }
        catch (e) { sigB = jobFailureLogger.signatureOf(e) }
        expect(sigA).toBe(sigB)
        expect(sigA).toMatch(/^Error@job-failure-logger\.test\.ts:\d+$/)
    })

    it('preserves the subclass name for a custom Error', () => {
        class BoomError extends Error {
            constructor() {
                super('boom')
                this.name = 'BoomError'
            }
        }
        try { throw new BoomError() }
        catch (e) {
            expect(jobFailureLogger.signatureOf(e)).toMatch(/^BoomError@/)
        }
    })

    it('returns just the typeof for non-Error thrown values', () => {
        expect(jobFailureLogger.signatureOf('nope')).toBe('string')
        expect(jobFailureLogger.signatureOf({ a: 1 })).toBe('object')
        expect(jobFailureLogger.signatureOf(undefined)).toBe('undefined')
    })
})
