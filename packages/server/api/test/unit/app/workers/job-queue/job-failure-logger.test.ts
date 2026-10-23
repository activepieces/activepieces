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

describe('jobFailureLogger.signatureFromMessage', () => {
    it('groups by the leading token before the first colon', () => {
        expect(jobFailureLogger.signatureFromMessage('ConnectionNotFoundError: connection abc not found', 'EngineError'))
            .toBe('EngineError@ConnectionNotFoundError')
        expect(jobFailureLogger.signatureFromMessage('ConnectionNotFoundError: connection xyz missing', 'EngineError'))
            .toBe('EngineError@ConnectionNotFoundError')
    })

    it('uses the first line when no colon is present, truncated to 80 chars', () => {
        expect(jobFailureLogger.signatureFromMessage('Sandbox process exited with code 137', 'EngineError'))
            .toBe('EngineError@Sandbox process exited with code 137')
    })

    it('groups a JSON-shaped message by its code instead of the opening brace', () => {
        const providerOutage = '{"code":502,"message":"Upstream error from Sail Research: no capacity available for this model right now","metadata":{"error_type":"provider_unavailable"}}'
        expect(jobFailureLogger.signatureFromMessage(providerOutage, 'EngineError')).toBe('EngineError@502')
        expect(jobFailureLogger.signatureFromMessage('{"code":"ENTITY_NOT_FOUND","message":"x"}', 'EngineError')).toBe('EngineError@ENTITY_NOT_FOUND')
    })

    it('handles empty message with unknown fallback', () => {
        expect(jobFailureLogger.signatureFromMessage('', 'EngineError')).toBe('EngineError@unknown')
    })
})
