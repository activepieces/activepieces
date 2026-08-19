import { describe, expect, it } from 'vitest'
import { dependencyGuard } from '../../../../src/lib/cache/code/dependency-guard'

describe('dependencyGuard.sanitize', () => {
    it('keeps registry-style dependencies', () => {
        const dependencies = {
            'lodash': '^4.17.21',
            '@activepieces/piece-slack': '0.1.0',
            'dayjs': '1.11.10',
            'zod': '>=3 <4',
            'left-pad': '*',
            'typescript': 'latest',
        }
        expect(dependencyGuard.sanitize(dependencies)).toEqual(dependencies)
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
        ['..'],
        ['.'],
        ['./sibling'],
    ])('drops non-registry spec %s', (spec) => {
        expect(dependencyGuard.sanitize({ evil: spec })).toEqual({})
    })

    it('drops entries whose version is not a string', () => {
        expect(dependencyGuard.sanitize({ a: 1, b: null, c: { from: '/etc' } })).toEqual({})
    })

    it('drops malformed package names', () => {
        expect(dependencyGuard.sanitize({ '../evil': '1.0.0', '.hidden': '1.0.0' })).toEqual({})
    })

    it('returns empty for non-object inputs', () => {
        expect(dependencyGuard.sanitize(undefined)).toEqual({})
        expect(dependencyGuard.sanitize(null)).toEqual({})
        expect(dependencyGuard.sanitize('lodash')).toEqual({})
        expect(dependencyGuard.sanitize(['lodash'])).toEqual({})
    })

    it('trims surrounding whitespace from kept versions', () => {
        expect(dependencyGuard.sanitize({ lodash: '  4.17.21  ' })).toEqual({ lodash: '4.17.21' })
    })
})
