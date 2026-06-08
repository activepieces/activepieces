import { describe, expect, it } from 'vitest'
import { expressionRewriter } from '../../../../../src/app/flows/flow-version/migrations/expression-rewriter'

const strip = (input: string, levels: number, stepNames: string[] = []): string =>
    expressionRewriter.stripOutputDeep(input, stepNames, levels)

describe('expressionRewriter.stripOutputDeep', () => {
    it('removes one erroneous level', () => {
        expect(strip('{{step_1[\'output\'][\'output\'].foo}}', 1))
            .toBe('{{step_1[\'output\'].foo}}')
    })
    it('removes two erroneous levels', () => {
        expect(strip('{{step_1[\'output\'][\'output\'][\'output\'].foo}}', 2))
            .toBe('{{step_1[\'output\'].foo}}')
    })
    it('never strips below one output (cap leaves >=1)', () => {
        expect(strip('{{step_1[\'output\'].foo}}', 3))
            .toBe('{{step_1[\'output\'].foo}}')
    })
    it('preserves legit pre-migration bracket access (run longer than levels)', () => {
        // user wrote step_1[\'output\'] pre-migration -> 1 synthetic + 1 real, plus 1 erroneous = 3
        expect(strip('{{step_1[\'output\'][\'output\'][\'output\']}}', 1))
            .toBe('{{step_1[\'output\'][\'output\']}}')
    })
    it('handles trigger reference', () => {
        expect(strip('{{trigger[\'output\'][\'output\'].body}}', 1))
            .toBe('{{trigger[\'output\'].body}}')
    })
    it('does not touch error access', () => {
        expect(strip('{{step_1[\'output\'][\'error\']}}', 2))
            .toBe('{{step_1[\'output\'][\'error\']}}')
    })
    it('does not touch dot-output (real field)', () => {
        expect(strip('{{step_1[\'output\'].output}}', 2))
            .toBe('{{step_1[\'output\'].output}}')
    })
    it('strips per-ref independently (mixed depths)', () => {
        expect(strip('{{step_1[\'output\'][\'output\']}} and {{step_5[\'output\']}}', 1, ['step_1', 'step_5']))
            .toBe('{{step_1[\'output\']}} and {{step_5[\'output\']}}')
    })
    it('leaves non-step identifiers alone', () => {
        expect(strip('{{foo[\'output\'][\'output\']}}', 1))
            .toBe('{{foo[\'output\'][\'output\']}}')
    })
    it('no-op when levels is zero', () => {
        expect(strip('{{step_1[\'output\'][\'output\']}}', 0))
            .toBe('{{step_1[\'output\'][\'output\']}}')
    })
    it('strips deeply nested in object values', () => {
        const input = { a: { b: '{{step_1[\'output\'][\'output\'].x}}' }, c: ['{{step_2[\'output\'][\'output\']}}'] }
        expect(expressionRewriter.stripOutputDeep(input, ['step_1', 'step_2'], 1))
            .toEqual({ a: { b: '{{step_1[\'output\'].x}}' }, c: ['{{step_2[\'output\']}}'] })
    })

    describe('round-trip: repair inverts the erroneous extra migrations', () => {
        const cases = [
            '{{step_1.foo}}',
            '{{step_1}}',
            '{{step_1.foo[\'bar\'][0].baz}}',
            '{{step_1[\'output\']}}', // user legitimately accessed an "output" field pre-migration
            '{{trigger.body.items[2]}}',
        ]
        const stepNames = ['step_1']
        for (const original of cases) {
            it(`recovers ${original}`, () => {
                const correct = expressionRewriter.rewriteStepReferences({ input: original, stepNames })
                let corrupted = correct
                const extraMigrations = 3
                for (let i = 0; i < extraMigrations; i++) {
                    corrupted = expressionRewriter.rewriteDeep(corrupted, stepNames)
                }
                expect(corrupted).not.toBe(correct)
                expect(expressionRewriter.stripOutputDeep(corrupted, stepNames, extraMigrations)).toBe(correct)
            })
        }
    })

    describe('multiple output levels x how many to cut', () => {
        const out = (n: number): string => '[\'output\']'.repeat(n)
        const ref = (depth: number, suffix = '.foo'): string => `{{step_1${out(depth)}${suffix}}}`

        // [ startingDepth, levelsToCut (E), expectedDepth ]
        const matrix: [number, number, number][] = [
            [2, 1, 1], // output output      , cut 1 -> output
            [3, 1, 2], // output^3           , cut 1 -> output^2 (partial: E underestimates)
            [3, 2, 1], // output^3           , cut 2 -> output
            [4, 3, 1], // output^4           , cut 3 -> output
            [5, 4, 1], // output^5           , cut 4 -> output
            [5, 2, 3], // output^5           , cut 2 -> output^3 (partial)
            [3, 9, 1], // E overshoots       , cut capped -> never below 1 output
            [1, 5, 1], // already correct     , cut nothing (cap leaves >=1)
        ]
        for (const [startDepth, levels, expectedDepth] of matrix) {
            it(`depth ${startDepth}, cut ${levels} -> depth ${expectedDepth}`, () => {
                expect(expressionRewriter.stripOutputDeep(ref(startDepth), ['step_1'], levels))
                    .toBe(ref(expectedDepth))
            })
        }

        it('cuts each reference by its own available depth, not a flat count', () => {
            // step_1 has 3 outputs, step_5 (added later) has only 2; cut up to 2
            const input = `{{step_1${out(3)}}} {{step_5${out(2)}}}`
            expect(expressionRewriter.stripOutputDeep(input, ['step_1', 'step_5'], 2))
                .toBe(`{{step_1${out(1)}}} {{step_5${out(1)}}}`)
        })

        it('preserves a real trailing output field while cutting synthetic ones', () => {
            // user wrote step_1['output'] (real field) -> correct migration makes output^2;
            // 2 extra erroneous migrations -> output^4. Cut 2 -> output^2 (1 synthetic + 1 real).
            expect(expressionRewriter.stripOutputDeep(ref(4, ''), ['step_1'], 2))
                .toBe(ref(2, ''))
        })
    })
})
