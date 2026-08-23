import { describe, expect, it } from 'vitest'
import { packageDependencies } from '../../../../../src/lib/cache/flow/code/package-dependencies'

describe('packageDependencies.sanitize', () => {
    it('keeps registry-style dependencies', () => {
        const result = packageDependencies.sanitize({
            'lodash': '^4.17.21',
            '@activepieces/piece-slack': '0.1.0',
            'dayjs': '1.11.10',
            'zod': '>=3 <4',
            'left-pad': '*',
        })
        expect(result).toEqual({
            'lodash': '^4.17.21',
            '@activepieces/piece-slack': '0.1.0',
            'dayjs': '1.11.10',
            'zod': '>=3 <4',
            'left-pad': '*',
        })
    })

    it.each([
        ['file:../../etc'],
        ['file:/etc/passwd'],
        ['link:/proc/self/root'],
        ['git+ssh://git@host/x.git'],
        ['github:user/repo'],
        ['user/repo'],
        ['https://evil.example/pkg.tgz'],
        ['npm:other@1.0.0'],
        ['workspace:*'],
        ['../local/path'],
    ])('drops non-registry spec %s', (spec) => {
        expect(packageDependencies.sanitize({ evil: spec })).toEqual({})
    })

    it('drops entries whose version is not a string', () => {
        expect(packageDependencies.sanitize({ a: 1, b: null, c: { from: '/etc' } })).toEqual({})
    })

    it('drops malformed package names', () => {
        expect(packageDependencies.sanitize({ '../evil': '1.0.0', '.hidden': '1.0.0' })).toEqual({})
    })

    it('returns empty for non-object inputs', () => {
        expect(packageDependencies.sanitize(undefined)).toEqual({})
        expect(packageDependencies.sanitize(null)).toEqual({})
        expect(packageDependencies.sanitize('lodash')).toEqual({})
        expect(packageDependencies.sanitize(['lodash'])).toEqual({})
    })

    it('trims surrounding whitespace from kept versions', () => {
        expect(packageDependencies.sanitize({ lodash: '  4.17.21  ' })).toEqual({ lodash: '4.17.21' })
    })
})
