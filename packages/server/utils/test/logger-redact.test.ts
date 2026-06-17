import { describe, expect, it } from 'vitest'
import { loggerRedact } from '../src/logger-redact'

describe('loggerRedact', () => {
    it('exports a redact config with the expected censor string', () => {
        expect(loggerRedact.censor).toBe('[REDACTED]')
    })

    it('includes authorization header path', () => {
        expect(loggerRedact.paths).toContain('req.headers.authorization')
    })

    it('includes password paths at depth 0, 1, and 2', () => {
        expect(loggerRedact.paths).toContain('password')
        expect(loggerRedact.paths).toContain('*.password')
        expect(loggerRedact.paths).toContain('*.*.password')
    })

    it('includes access_token paths', () => {
        expect(loggerRedact.paths).toContain('access_token')
        expect(loggerRedact.paths).toContain('*.access_token')
    })

    it('includes connection.value path', () => {
        expect(loggerRedact.paths).toContain('connection.value')
    })

    it('includes err.response.data for axios error redaction', () => {
        expect(loggerRedact.paths).toContain('err.response.data')
    })
})
