import { describe, expect, it } from 'vitest'
import { evaluateExpression } from '../../src/lib/formula/function-evaluator'

/**
 * These tests verify that expression strings survive a full round-trip through
 * the evaluator by running them and checking the output is reasonable.
 *
 * Pure serialization round-trip (tokenize → TipTap JSON → serialize → string)
 * lives in the web package since it depends on TipTap types.
 * Here we test that the *evaluator* handles the same expressions end-to-end.
 */

const DATA = {
    name: 'alice',
    score: 42,
    items: [
        { label: 'a', value: 1 },
        { label: 'b', value: 2 },
    ],
}

describe('expression round-trip through evaluator', () => {
    const cases: [string, unknown][] = [
        ['trim("  hello  ")', 'hello'],
        ['uppercase("hello")', 'HELLO'],
        ['lowercase("WORLD")', 'world'],
        ['combine("foo";"bar";" ")', 'foo bar'],
        ['add(1;2)', 3],
        ['multiply(3;4)', 12],
        ['if(1;"yes";"no")', 'yes'],
        ['if(0;"yes";"no")', 'no'],
        ['coalesce("";"fallback")', 'fallback'],
        ['is_empty("")', true],
        ['is_not_empty("hi")', true],
        ['trim(uppercase(" hello "))', 'HELLO'],
        ['combine(uppercase("foo");lowercase("BAR");" ")', 'FOO bar'],
        ['if(is_empty("");"was empty";"had value")', 'was empty'],
    ]

    cases.forEach(([expr, expected]) => {
        it(`${expr}  →  ${JSON.stringify(expected)}`, () => {
            const { result, error } = evaluateExpression(expr, DATA)
            expect(error).toBeNull()
            expect(result).toEqual(expected)
        })
    })
})

describe('variable interpolation round-trip', () => {
    it('single variable resolves', () => {
        const { result } = evaluateExpression('uppercase({{name}})', DATA)
        expect(result).toBe('ALICE')
    })

    it('variable in nested call', () => {
        const { result } = evaluateExpression('trim(uppercase({{name}}))', DATA)
        expect(result).toBe('ALICE')
    })

    it('mixed text and variable', () => {
        const { result } = evaluateExpression('Hello {{name}}', DATA)
        expect(result).toBe('Hello alice')
    })

    it('function result mixed with plain text', () => {
        const { result } = evaluateExpression('Score: add({{score}};8)', DATA)
        expect(result).toBe('Score: 50')
    })

    it('literal `)` inside a quoted string arg does not break the call', () => {
        const { result, error } = evaluateExpression('prefix("hi";"(CEO) ")', DATA)
        expect(error).toBeNull()
        expect(result).toBe('(CEO) hi')
    })

    it('literal `;` inside a quoted string arg is not treated as separator', () => {
        const { result, error } = evaluateExpression('combine("a;b";"c;d";" | ")', DATA)
        expect(error).toBeNull()
        expect(result).toBe('a;b | c;d')
    })
})
