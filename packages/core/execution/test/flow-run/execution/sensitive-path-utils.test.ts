import { applySensitivePaths } from '../../../src/lib/flow-run/execution/sensitive-path-utils'
import { SENSITIVE_VALUE_REDACTED } from '../../../src/lib/engine/engine-constants'

describe('applySensitivePaths', () => {
    it('returns value unchanged when no paths given', () => {
        const value = { SecretString: 'sk-real', Name: 'my-secret' }
        expect(applySensitivePaths(value, undefined)).toBe(value)
        expect(applySensitivePaths(value, [])).toBe(value)
    })

    it('redacts a top-level string leaf', () => {
        const value = { SecretString: 'sk-real', Name: 'my-secret' }
        const result = applySensitivePaths(value, ['SecretString']) as Record<string, unknown>
        expect(result.SecretString).toBe(SENSITIVE_VALUE_REDACTED)
        expect(result.Name).toBe('my-secret')
    })

    it('redacts a nested object leaf', () => {
        const value = { data: { password: 'p', label: 'ok' } }
        const result = applySensitivePaths(value, ['data.password']) as { data: Record<string, unknown> }
        expect(result.data.password).toBe(SENSITIVE_VALUE_REDACTED)
        expect(result.data.label).toBe('ok')
    })

    it('redacts a leaf inside an array item by index path', () => {
        const value = { items: [{ token: 'a', name: 'x' }, { token: 'b', name: 'y' }] }
        const result = applySensitivePaths(value, ['items.0.token', 'items.1.token']) as { items: Array<Record<string, unknown>> }
        expect(result.items[0].token).toBe(SENSITIVE_VALUE_REDACTED)
        expect(result.items[1].token).toBe(SENSITIVE_VALUE_REDACTED)
        expect(result.items[0].name).toBe('x')
    })

    it('redacts a subtree when the flagged path is not a leaf', () => {
        const value = { blob: { a: 1, b: { c: 2 } } }
        const result = applySensitivePaths(value, ['blob']) as Record<string, unknown>
        expect(result.blob).toBe(SENSITIVE_VALUE_REDACTED)
    })

    it('ignores paths that do not exist in the value', () => {
        const value = { Name: 'ok' } as Record<string, unknown>
        const result = applySensitivePaths(value, ['SecretString']) as Record<string, unknown>
        expect(result).toEqual({ Name: 'ok' })
    })

    it('does not mutate the input', () => {
        const value = { data: { password: 'p' } }
        const snapshot = JSON.parse(JSON.stringify(value))
        applySensitivePaths(value, ['data.password'])
        expect(value).toEqual(snapshot)
    })
})
