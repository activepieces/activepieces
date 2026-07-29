import { propertyPath } from '../../src/lib/variables/property-path'

describe('propertyPath', () => {
    describe('parse — valid paths', () => {
        it('parses dot paths', () => {
            expect(propertyPath.parse('step_1.output.field')).toEqual(['step_1', 'output', 'field'])
        })

        it('parses a bare identifier', () => {
            expect(propertyPath.parse('step_1')).toEqual(['step_1'])
        })

        it('parses identifiers starting with $ and _', () => {
            expect(propertyPath.parse('$root.value')).toEqual(['$root', 'value'])
            expect(propertyPath.parse('_private.x')).toEqual(['_private', 'x'])
            expect(propertyPath.parse('$')).toEqual(['$'])
            expect(propertyPath.parse('_')).toEqual(['_'])
        })

        it('parses identifiers with digits after the first character', () => {
            expect(propertyPath.parse('step_1.a1b2')).toEqual(['step_1', 'a1b2'])
        })

        it('parses non-ascii identifiers like real JS', () => {
            expect(propertyPath.parse('é.b')).toEqual(['é', 'b'])
        })

        it('parses numeric index paths', () => {
            expect(propertyPath.parse('trigger.output.items[0]')).toEqual(['trigger', 'output', 'items', '0'])
            expect(propertyPath.parse('a[123]')).toEqual(['a', '123'])
        })

        it('parses float indexes to their JS property-key form', () => {
            expect(propertyPath.parse('a[1.5]')).toEqual(['a', '1.5'])
        })

        it('parses chained numeric indexes', () => {
            expect(propertyPath.parse('a[0][1][2]')).toEqual(['a', '0', '1', '2'])
        })

        it('parses index followed by dot access', () => {
            expect(propertyPath.parse('a[0].b[1].c')).toEqual(['a', '0', 'b', '1', 'c'])
        })

        it('parses single-quoted bracket paths', () => {
            expect(propertyPath.parse('step_4[\'error\'][\'message\']')).toEqual(['step_4', 'error', 'message'])
        })

        it('parses double-quoted bracket paths', () => {
            expect(propertyPath.parse('step_1["some key"]')).toEqual(['step_1', 'some key'])
        })

        it('parses quoted keys containing spaces, dots and brackets as one segment', () => {
            expect(propertyPath.parse('a[\'b.c\']')).toEqual(['a', 'b.c'])
            expect(propertyPath.parse('a[\'b[0]\']')).toEqual(['a', 'b[0]'])
            expect(propertyPath.parse('a[\'  spaced  \']')).toEqual(['a', '  spaced  '])
        })

        it('parses quoted keys that resemble blocked words only when not exact', () => {
            expect(propertyPath.parse('a[\'proto\']')).toEqual(['a', 'proto'])
            expect(propertyPath.parse('a[\'constructor_\']')).toEqual(['a', 'constructor_'])
        })

        it('parses an empty quoted key', () => {
            expect(propertyPath.parse('a[\'\']')).toEqual(['a', ''])
            expect(propertyPath.parse('a[""]')).toEqual(['a', ''])
        })

        it('parses the other quote style inside quoted keys', () => {
            expect(propertyPath.parse('a[\'say "hi"\']')).toEqual(['a', 'say "hi"'])
            expect(propertyPath.parse('a["it\'s"]')).toEqual(['a', 'it\'s'])
        })

        it('decodes escaped quotes and backslashes inside quoted keys', () => {
            expect(propertyPath.parse('step_1[\'it\\\'s\']')).toEqual(['step_1', 'it\'s'])
            expect(propertyPath.parse('a["say \\"hi\\""]')).toEqual(['a', 'say "hi"'])
            expect(propertyPath.parse('a[\'b\\\\c\']')).toEqual(['a', 'b\\c'])
        })

        it('decodes single-character escapes like real JS', () => {
            expect(propertyPath.parse('a[\'line\\nbreak\']')).toEqual(['a', 'line\nbreak'])
            expect(propertyPath.parse('a[\'tab\\there\']')).toEqual(['a', 'tab\there'])
            expect(propertyPath.parse('a[\'\\a\']')).toEqual(['a', 'a'])
        })

        it('accepts raw control characters inside quoted keys as literals', () => {
            expect(propertyPath.parse('a[\'line\nbreak\']')).toEqual(['a', 'line\nbreak'])
            expect(propertyPath.parse('a[\'tab\there\']')).toEqual(['a', 'tab\there'])
        })

        it('tolerates whitespace around accessors like real JS', () => {
            expect(propertyPath.parse(' a')).toEqual(['a'])
            expect(propertyPath.parse('a ')).toEqual(['a'])
            expect(propertyPath.parse('a .b')).toEqual(['a', 'b'])
            expect(propertyPath.parse('a. b')).toEqual(['a', 'b'])
            expect(propertyPath.parse('a\n.b')).toEqual(['a', 'b'])
            expect(propertyPath.parse('a [0]')).toEqual(['a', '0'])
        })

        it('parses optional chaining with plain traversal semantics', () => {
            expect(propertyPath.parse('a?.b')).toEqual(['a', 'b'])
            expect(propertyPath.parse('a?.[0]')).toEqual(['a', '0'])
        })

        it('parses mixed dot, index and quoted access', () => {
            expect(propertyPath.parse('a.b[0][\'c\'].d["e"][1]')).toEqual(['a', 'b', '0', 'c', 'd', 'e', '1'])
        })

        it('parses quoted keys containing mustache-like braces', () => {
            expect(propertyPath.parse('a[\'{{nested}}\']')).toEqual(['a', '{{nested}}'])
        })

        it('allows literal keywords as non-root segments', () => {
            expect(propertyPath.parse('a.true')).toEqual(['a', 'true'])
            expect(propertyPath.parse('a[\'false\']')).toEqual(['a', 'false'])
            expect(propertyPath.parse('a.undefined')).toEqual(['a', 'undefined'])
        })
    })

    describe('parse — expressions and malformed input fall back (null)', () => {
        it('rejects arithmetic and comparisons', () => {
            expect(propertyPath.parse('trigger.output.price + 2')).toBeNull()
            expect(propertyPath.parse('a - b')).toBeNull()
            expect(propertyPath.parse('step_4.output === undefined')).toBeNull()
            expect(propertyPath.parse('a || b')).toBeNull()
            expect(propertyPath.parse('!a')).toBeNull()
        })

        it('rejects function calls and constructors', () => {
            expect(propertyPath.parse('Math.min(trigger.output.price, 2)')).toBeNull()
            expect(propertyPath.parse('flattenNestedKeys(trigger.output, [\'users\'])')).toBeNull()
            expect(propertyPath.parse('a.b()')).toBeNull()
            expect(propertyPath.parse('new Date()')).toBeNull()
        })

        it('rejects literals and structured values', () => {
            expect(propertyPath.parse('{"where": "a"}')).toBeNull()
            expect(propertyPath.parse('[1, 2]')).toBeNull()
            expect(propertyPath.parse('"a string"')).toBeNull()
            expect(propertyPath.parse('\'a string\'')).toBeNull()
            expect(propertyPath.parse('123')).toBeNull()
            expect(propertyPath.parse('1.5')).toBeNull()
        })

        it('rejects literal keyword roots so the sandbox keeps evaluating them', () => {
            expect(propertyPath.parse('true')).toBeNull()
            expect(propertyPath.parse('false')).toBeNull()
            expect(propertyPath.parse('null')).toBeNull()
            expect(propertyPath.parse('undefined')).toBeNull()
            expect(propertyPath.parse('NaN')).toBeNull()
            expect(propertyPath.parse('Infinity')).toBeNull()
            expect(propertyPath.parse('true.b')).toBeNull()
            expect(propertyPath.parse('undefined[0]')).toBeNull()
        })

        it('rejects empty input', () => {
            expect(propertyPath.parse('')).toBeNull()
            expect(propertyPath.parse(' ')).toBeNull()
        })

        it('rejects malformed dots', () => {
            expect(propertyPath.parse('.a')).toBeNull()
            expect(propertyPath.parse('a.')).toBeNull()
            expect(propertyPath.parse('a..b')).toBeNull()
            expect(propertyPath.parse('a.b.')).toBeNull()
        })

        it('rejects malformed brackets', () => {
            expect(propertyPath.parse('a[]')).toBeNull()
            expect(propertyPath.parse('a[b]')).toBeNull()
            expect(propertyPath.parse('a[b.c]')).toBeNull()
            expect(propertyPath.parse('a[-1]')).toBeNull()
            expect(propertyPath.parse('a[01x]')).toBeNull()
            expect(propertyPath.parse('a[\'b\']extra')).toBeNull()
            expect(propertyPath.parse('a[\'b\'')).toBeNull()
            expect(propertyPath.parse('a[\'b]')).toBeNull()
            expect(propertyPath.parse('a["b\']')).toBeNull()
            expect(propertyPath.parse('a[\'b"]')).toBeNull()
            expect(propertyPath.parse('[\'a\']')).toBeNull()
            expect(propertyPath.parse('a]0[')).toBeNull()
        })

        it('rejects identifiers with a leading digit or operator characters', () => {
            expect(propertyPath.parse('1a')).toBeNull()
            expect(propertyPath.parse('a.1b')).toBeNull()
            expect(propertyPath.parse('a-b')).toBeNull()
            expect(propertyPath.parse('a.b-c')).toBeNull()
        })

        it('rejects statement-like input', () => {
            expect(propertyPath.parse('a;b')).toBeNull()
            expect(propertyPath.parse('a, b')).toBeNull()
            expect(propertyPath.parse('`a`')).toBeNull()
        })

        it('rejects escape sequences jsep does not decode faithfully', () => {
            expect(propertyPath.parse('a[\'\\u0061\']')).toBeNull()
            expect(propertyPath.parse('a[\'\\x61\']')).toBeNull()
            expect(propertyPath.parse('a[\'\\0\']')).toBeNull()
            expect(propertyPath.parse('a["\\u{61}"]')).toBeNull()
        })

        it('rejects prototype-polluting segments anywhere in the path', () => {
            expect(propertyPath.parse('__proto__')).toBeNull()
            expect(propertyPath.parse('step_1.__proto__.x')).toBeNull()
            expect(propertyPath.parse('step_1.constructor')).toBeNull()
            expect(propertyPath.parse('step_1[\'prototype\']')).toBeNull()
            expect(propertyPath.parse('step_1["__proto__"]')).toBeNull()
            expect(propertyPath.parse('a.b.c.constructor.d')).toBeNull()
        })
    })

    describe('resolveValue', () => {
        const scope = {
            step_1: {
                output: {
                    name: 'John',
                    items: [5, 'a'],
                    zero: 0,
                    emptyString: '',
                    isFalse: false,
                    nullValue: null,
                    nested: { '0': 'numeric-key', 'weird key': 'found', '': 'empty-key' },
                },
            },
        }

        it('walks nested objects and arrays', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'name'], scope })).toBe('John')
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'items', '1'], scope })).toBe('a')
        })

        it('preserves falsy leaf values', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'zero'], scope })).toBe(0)
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'emptyString'], scope })).toBe('')
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'isFalse'], scope })).toBe(false)
        })

        it('returns null for a null leaf', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'nullValue'], scope })).toBeNull()
        })

        it('returns undefined for missing roots and missing leaves', () => {
            expect(propertyPath.resolveValue({ segments: ['step_99'], scope })).toBeUndefined()
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'missing'], scope })).toBeUndefined()
        })

        it('returns undefined when traversing through missing or null intermediates', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'missing', 'deep'], scope })).toBeUndefined()
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'nullValue', 'deep'], scope })).toBeUndefined()
        })

        it('returns undefined for out-of-bounds array access', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'items', '9'], scope })).toBeUndefined()
        })

        it('resolves numeric string keys on plain objects', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'nested', '0'], scope })).toBe('numeric-key')
        })

        it('resolves keys with spaces and the empty-string key', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'nested', 'weird key'], scope })).toBe('found')
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'nested', ''], scope })).toBe('empty-key')
        })

        it('reads properties of primitives via boxing', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'name', 'length'], scope })).toBe(4)
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'items', 'length'], scope })).toBe(2)
        })

        it('returns undefined when traversing past a primitive leaf', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'zero', 'anything'], scope })).toBeUndefined()
        })

        it('resolves the whole root object', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1'], scope })).toBe(scope.step_1)
        })
    })
})
