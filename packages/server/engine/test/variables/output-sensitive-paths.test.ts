import { collectSensitiveOutputPaths } from '../../src/lib/variables/output-sensitive-paths'

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
