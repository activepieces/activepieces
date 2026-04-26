import { describe, expect, it } from 'vitest'
import { rewriteModel } from '../../../../src/app/chat/anthropic-proxy-controller'

describe('rewriteModel', () => {
    it('rewrites a standard Anthropic model ID to OpenRouter format with dot version', () => {
        const body = JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024 })
        const result = rewriteModel(body)
        const parsed = JSON.parse(result)
        expect(parsed.model).toBe('anthropic/claude-sonnet-4.6')
    })

    it('does not modify a body that already contains a slash in the model (already in OpenRouter format)', () => {
        const body = JSON.stringify({ model: 'anthropic/claude-sonnet-4.6', stream: true })
        const result = rewriteModel(body)
        expect(result).toBe(body)
    })

    it('returns the body unchanged when there is no model field', () => {
        const body = JSON.stringify({ max_tokens: 1024, stream: false })
        const result = rewriteModel(body)
        expect(result).toBe(body)
    })

    it('rewrites model with a single trailing numeric suffix', () => {
        const body = JSON.stringify({ model: 'claude-opus-3-5' })
        const result = rewriteModel(body)
        const parsed = JSON.parse(result)
        expect(parsed.model).toBe('anthropic/claude-opus-3.5')
    })

    it('preserves other body fields while rewriting the model', () => {
        const body = JSON.stringify({ model: 'claude-haiku-3-5', messages: [{ role: 'user', content: 'hi' }], temperature: 0.7 })
        const result = rewriteModel(body)
        const parsed = JSON.parse(result)
        expect(parsed.model).toBe('anthropic/claude-haiku-3.5')
        expect(parsed.messages).toEqual([{ role: 'user', content: 'hi' }])
        expect(parsed.temperature).toBe(0.7)
    })

    it('handles a model name with no numeric suffix (no version digit to replace with dot)', () => {
        const body = JSON.stringify({ model: 'claude-instant' })
        const result = rewriteModel(body)
        const parsed = JSON.parse(result)
        // No trailing -N so no .N replacement, but still prefixed with anthropic/
        expect(parsed.model).toBe('anthropic/claude-instant')
    })

    it('handles an empty body string without throwing', () => {
        expect(() => rewriteModel('')).not.toThrow()
        expect(rewriteModel('')).toBe('')
    })

    it('handles a body where model field has extra whitespace around the colon', () => {
        // The regex allows whitespace between "model" and the value
        const body = '{"model"  :  "claude-sonnet-4-6"}'
        const result = rewriteModel(body)
        const parsed = JSON.parse(result)
        expect(parsed.model).toBe('anthropic/claude-sonnet-4.6')
    })

    it('rewrites only the model field, leaving the rest of the raw string intact', () => {
        const before = '{"foo":"bar","model":"claude-haiku-3-5","baz":42}'
        const result = rewriteModel(before)
        // The rewritten model key uses compact formatting
        expect(result).toContain('"model":"anthropic/claude-haiku-3.5"')
        expect(result).toContain('"foo":"bar"')
        expect(result).toContain('"baz":42')
    })
})
