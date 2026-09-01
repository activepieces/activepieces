import { SENSITIVE_VALUE_REDACTED, SENSITIVE_WHOLE_OUTPUT_PATH } from '../../../src/lib/engine/engine-constants'
import { collectSensitiveOutputPaths } from '../../../src/lib/flow-run/execution/output-sensitive-paths'
import { applySensitivePaths } from '../../../src/lib/flow-run/execution/sensitive-path-utils'

describe('collectSensitiveOutputPaths', () => {
    it('returns undefined when the schema is missing or empty', () => {
        expect(collectSensitiveOutputPaths(undefined, {})).toBeUndefined()
        expect(collectSensitiveOutputPaths({ fields: [] }, {})).toBeUndefined()
    })

    it('returns undefined when no field is flagged sensitive', () => {
        expect(collectSensitiveOutputPaths({
            fields: [
                { key: 'a' },
                { key: 'b' },
            ],
        }, { a: 1, b: 2 })).toBeUndefined()
    })

    it('collects a top-level sensitive key', () => {
        const paths = collectSensitiveOutputPaths({
            fields: [
                { key: 'SecretString', sensitive: true },
                { key: 'Name' },
            ],
        }, { SecretString: 'sk', Name: 'x' })
        expect(paths).toEqual(['SecretString'])
    })

    it('recurses into nested children', () => {
        const paths = collectSensitiveOutputPaths({
            fields: [
                {
                    key: 'data',
                    children: [
                        { key: 'password', sensitive: true },
                        { key: 'label' },
                    ],
                },
            ],
        }, { data: { password: 'p', label: 'ok' } })
        expect(paths).toEqual(['data.password'])
    })

    it('materialises concrete indexes for listItems against the raw output', () => {
        const paths = collectSensitiveOutputPaths({
            fields: [
                {
                    key: 'items',
                    listItems: [
                        { key: 'token', sensitive: true },
                        { key: 'name' },
                    ],
                },
            ],
        }, { items: [{ token: 'a', name: 'x' }, { token: 'b', name: 'y' }] })
        expect(paths).toEqual(['items.0.token', 'items.1.token'])
    })

    it('returns the whole subtree path when a non-leaf field is flagged', () => {
        const paths = collectSensitiveOutputPaths({
            fields: [
                {
                    key: 'blob',
                    sensitive: true,
                    children: [
                        { key: 'inner' },
                    ],
                },
            ],
        }, { blob: { inner: 'x' } })
        expect(paths).toEqual(['blob'])
    })

    it('materialises per-key paths for dynamicKey maps with sensitive children', () => {
        const paths = collectSensitiveOutputPaths({
            fields: [
                {
                    key: 'accounts',
                    dynamicKey: true,
                    children: [
                        { key: 'accessToken', sensitive: true },
                        { key: 'label' },
                    ],
                },
            ],
        }, { accounts: { acc_1: { accessToken: 'sk-a', label: 'x' }, acc_2: { accessToken: 'sk-b', label: 'y' } } })
        expect(paths).toEqual(['accounts.acc_1.accessToken', 'accounts.acc_2.accessToken'])
    })

    it('returns undefined for a dynamicKey map whose raw value is missing', () => {
        const paths = collectSensitiveOutputPaths({
            fields: [
                {
                    key: 'accounts',
                    dynamicKey: true,
                    children: [
                        { key: 'accessToken', sensitive: true },
                    ],
                },
            ],
        }, { accounts: null })
        expect(paths).toBeUndefined()
    })

    it('handles arrays that are missing or non-array raw values', () => {
        const paths = collectSensitiveOutputPaths({
            fields: [
                {
                    key: 'items',
                    listItems: [
                        { key: 'token', sensitive: true },
                    ],
                },
            ],
        }, { items: null })
        expect(paths).toBeUndefined()
    })
})

describe('collectSensitiveOutputPaths — fail-closed guards', () => {
    function redact(schema: Parameters<typeof collectSensitiveOutputPaths>[0], output: unknown): unknown {
        return applySensitivePaths(output, collectSensitiveOutputPaths(schema, output))
    }

    it('redacts the whole output when a sensitive leaf carries a value path override', () => {
        const output = { data: { access_token: 'sk-REAL' } }
        const schema = { fields: [{ key: 'accessToken', value: 'data.access_token', sensitive: true }] }

        expect(collectSensitiveOutputPaths(schema, output)).toEqual([SENSITIVE_WHOLE_OUTPUT_PATH])
        expect(redact(schema, output)).toBe(SENSITIVE_VALUE_REDACTED)
        expect(JSON.stringify(redact(schema, output))).not.toContain('sk-REAL')
    })

    it('redacts the whole output when a value-overridden parent wraps a sensitive child', () => {
        const output = { body: { token: 'sk-REAL' } }
        const schema = { fields: [{ key: 'issue', value: 'body', children: [{ key: 'token', sensitive: true }] }] }

        expect(redact(schema, output)).toBe(SENSITIVE_VALUE_REDACTED)
        expect(JSON.stringify(redact(schema, output))).not.toContain('sk-REAL')
    })

    it('redacts the whole output when the schema marks the entire payload sensitive via an empty value', () => {
        const output = { a: 'sk-REAL' }
        const schema = { fields: [{ key: 'records', value: '', sensitive: true }] }

        expect(redact(schema, output)).toBe(SENSITIVE_VALUE_REDACTED)
        expect(JSON.stringify(redact(schema, output))).not.toContain('sk-REAL')
    })

    it('redacts the whole output when the payload is a top-level array', () => {
        const output = [{ token: 'sk-REAL' }, { token: 'sk-REAL-2' }]
        const schema = { fields: [{ key: 'token', sensitive: true }] }

        expect(redact(schema, output)).toBe(SENSITIVE_VALUE_REDACTED)
        expect(JSON.stringify(redact(schema, output))).not.toContain('sk-REAL')
    })

    it('leaves a value override alone when nothing in its subtree is sensitive', () => {
        const output = { body: { title: 'hello' } }
        const schema = { fields: [{ key: 'issue', value: 'body', children: [{ key: 'title' }] }] }

        expect(collectSensitiveOutputPaths(schema, output)).toBeUndefined()
        expect(redact(schema, output)).toEqual(output)
    })

    it('still resolves precise paths when a sensitive field declares a value equal to its key', () => {
        const output = { SecretString: 'sk-REAL', Name: 'visible' }
        const schema = { fields: [{ key: 'SecretString', value: 'SecretString', sensitive: true }, { key: 'Name' }] }

        expect(collectSensitiveOutputPaths(schema, output)).toEqual(['SecretString'])
        expect(redact(schema, output)).toEqual({ SecretString: SENSITIVE_VALUE_REDACTED, Name: 'visible' })
    })
})
