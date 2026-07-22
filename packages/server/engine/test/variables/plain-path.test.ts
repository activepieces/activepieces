import { plainPath } from '../../src/lib/variables/plain-path'

describe('plainPath.parseToken', () => {
    test.each([
        ['step_1', ['step_1']],
        ['trigger', ['trigger']],
        ['_private', ['_private']],
        ['$ref', ['$ref']],
        ['step_1.output', ['step_1', 'output']],
        ['step_1.output.items', ['step_1', 'output', 'items']],
        ['trigger.output.name', ['trigger', 'output', 'name']],
        ['step_1[\'output\']', ['step_1', 'output']],
        ['step_1["output"]', ['step_1', 'output']],
        ['step_1[\'output\'][\'rows\']', ['step_1', 'output', 'rows']],
        ['trigger.output.items[0]', ['trigger', 'output', 'items', '0']],
        ['trigger.output.items[10]', ['trigger', 'output', 'items', '10']],
        ['step_1[\'weird.key\']', ['step_1', 'weird.key']],
        ['step_1[\'has space\']', ['step_1', 'has space']],
        ['step_1[\'has"quote\']', ['step_1', 'has"quote']],
        ['step_1.output[\'a\'][0][\'b\']', ['step_1', 'output', 'a', '0', 'b']],
    ])('accepts plain access %s', (token, expected) => {
        expect(plainPath.parseToken(token)).toEqual(expected)
    })

    test.each([
        [''],
        ['1step'],
        ['1 + 1'],
        [' step_1'],
        ['step_1 '],
        ['step_1 .output'],
        ['step_1. output'],
        ['upper(step_1.x)'],
        ['step_1.output()'],
        ['step_1.output || \'x\''],
        ['step_1.x ? 1 : 2'],
        ['step_1.x; y'],
        ['{"a":1}'],
        ['flattenNestedKeys(step_1, [\'a\'])'],
        ['step_1.[\'output\']'],
        ['step_1..output'],
        ['step_1.'],
        ['step_1['],
        ['step_1[]'],
        ['step_1[0'],
        ['step_1[\'unterminated'],
        ['step_1[\'a\\\'b\']'],
        ['step_1[01]'],
        ['step_1[00]'],
        ['step_1[-1]'],
        ['step_1[1e3]'],
        ['step_1[1.5]'],
        ['step_1[`x`]'],
        ['step_1[1234567890123456]'],
    ])('rejects non-plain token %s', (token) => {
        expect(plainPath.parseToken(token)).toBeNull()
    })

    test('is ReDoS-safe on large adversarial inputs', () => {
        const inputs = [
            'a' + '['.repeat(50_000),
            'a' + '.'.repeat(50_000),
            'a[\'' + 'x'.repeat(100_000),
            'a.' + 'b.'.repeat(50_000),
            'a' + '[0]'.repeat(30_000),
        ]
        for (const input of inputs) {
            const start = performance.now()
            plainPath.parseToken(input)
            expect(performance.now() - start).toBeLessThan(50)
        }
    })
})

describe('plainPath.resolve', () => {
    const root = {
        step_1: { output: { items: [5, 'a'], name: 'John', nested: { deep: 1 } }, error: undefined },
        step_2: { output: 'a string', error: undefined },
    }

    test.each([
        [['step_1', 'output', 'name'], 'John'],
        [['step_1', 'output', 'items', '0'], 5],
        [['step_1', 'output', 'items', '1'], 'a'],
        [['step_1', 'output', 'nested', 'deep'], 1],
    ])('walks own properties %j', (segments, expected) => {
        expect(plainPath.resolve({ segments, root })).toEqual({ kind: 'hit', value: expected })
    })

    test.each([
        [['step_1', 'output', 'missing']],
        [['step_1', 'output', 'items', '9']],
        [['step_1', 'output', 'nested', 'absent']],
    ])('missing own key resolves to empty string %j', (segments) => {
        expect(plainPath.resolve({ segments, root })).toEqual({ kind: 'hit', value: '' })
    })

    test.each([
        [['step_99']],
        [['Math']],
    ])('unknown head segment misses %j', (segments) => {
        expect(plainPath.resolve({ segments, root })).toEqual({ kind: 'miss' })
    })

    test('boxed-primitive property access misses (falls back to eval)', () => {
        expect(plainPath.resolve({ segments: ['step_2', 'output', 'length'], root })).toEqual({ kind: 'miss' })
    })

    test.each([
        [['__proto__']],
        [['constructor']],
        [['prototype']],
        [['step_1', '__proto__', 'x']],
        [['step_1', 'constructor', 'prototype']],
    ])('blocklisted segment resolves to empty string %j', (segments) => {
        expect(plainPath.resolve({ segments, root })).toEqual({ kind: 'hit', value: '' })
    })

    test('does not pollute Object.prototype', () => {
        plainPath.resolve({ segments: ['step_1', '__proto__', 'polluted'], root })
        expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    })

    test('bare head returns the whole value', () => {
        expect(plainPath.resolve({ segments: ['step_1'], root })).toEqual({ kind: 'hit', value: root.step_1 })
    })
})
