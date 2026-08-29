import { jsonStreamUtils } from '../src/lib/json-stream'

const { jsonObject, jsonArray, definedEntries } = jsonStreamUtils

const collect = (gen: Generator<string>) => Array.from(gen).join('')

describe('jsonStreamUtils', () => {
    it('streams a nested structure byte-identical to JSON.stringify', () => {
        const expected = {
            version: 2,
            state: {
                steps: { a: { output: [1, 2] }, b: 'text' },
                tags: [],
            },
        }
        const streamed = collect(jsonObject([
            ['version', '2'],
            ['state', jsonObject([
                ['steps', jsonObject([
                    ['a', JSON.stringify({ output: [1, 2] })],
                    ['b', JSON.stringify('text')],
                ])],
                ['tags', '[]'],
            ])],
        ]))
        expect(streamed).toBe(JSON.stringify(expected))
        expect(JSON.parse(streamed)).toEqual(expected)
    })

    it('streams arrays of generators with separators', () => {
        const streamed = collect(jsonArray([
            jsonObject([['x', '1']]),
            jsonObject([['y', '2']]),
            JSON.stringify(3),
        ]))
        expect(streamed).toBe('[{"x":1},{"y":2},3]')
    })

    it('streams empty object and array', () => {
        expect(collect(jsonObject([]))).toBe('{}')
        expect(collect(jsonArray([]))).toBe('[]')
    })

    it('escapes keys like JSON.stringify does', () => {
        expect(collect(jsonObject([['a"b\n', '1']]))).toBe(JSON.stringify({ 'a"b\n': 1 }))
    })

    it('definedEntries drops undefined values and stringifies the rest', () => {
        expect(definedEntries({ a: 1, b: undefined, c: 'x' })).toEqual([
            ['a', '1'],
            ['c', '"x"'],
        ])
    })
})
