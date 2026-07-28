import { propertyPath } from '../../src/lib/variables/property-path'

describe('propertyPath', () => {
    describe('parse', () => {
        it('parses dot paths', () => {
            expect(propertyPath.parse('step_1.output.field')).toEqual(['step_1', 'output', 'field'])
        })

        it('parses bracket string paths', () => {
            expect(propertyPath.parse('step_4[\'error\'][\'message\']')).toEqual(['step_4', 'error', 'message'])
        })

        it('parses double-quoted bracket paths', () => {
            expect(propertyPath.parse('step_1["some key"]')).toEqual(['step_1', 'some key'])
        })

        it('parses numeric index paths', () => {
            expect(propertyPath.parse('trigger.output.items[0]')).toEqual(['trigger', 'output', 'items', '0'])
        })

        it('parses a bare identifier', () => {
            expect(propertyPath.parse('step_1')).toEqual(['step_1'])
        })

        it('unescapes quoted segments', () => {
            expect(propertyPath.parse('step_1[\'it\\\'s\']')).toEqual(['step_1', 'it\'s'])
        })

        it('rejects expressions', () => {
            expect(propertyPath.parse('trigger.output.price + 2')).toBeNull()
            expect(propertyPath.parse('Math.min(trigger.output.price, 2)')).toBeNull()
            expect(propertyPath.parse('flattenNestedKeys(trigger.output, [\'users\'])')).toBeNull()
            expect(propertyPath.parse('{"where": "a"}')).toBeNull()
            expect(propertyPath.parse('step_4.output === undefined')).toBeNull()
            expect(propertyPath.parse('')).toBeNull()
        })

        it('rejects prototype-polluting segments', () => {
            expect(propertyPath.parse('step_1.__proto__.x')).toBeNull()
            expect(propertyPath.parse('step_1.constructor')).toBeNull()
            expect(propertyPath.parse('step_1[\'prototype\']')).toBeNull()
            expect(propertyPath.parse('__proto__')).toBeNull()
        })
    })

    describe('resolveValue', () => {
        const scope = {
            step_1: {
                output: {
                    name: 'John',
                    items: [5, 'a'],
                },
            },
        }

        it('walks nested objects and arrays', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'name'], scope })).toBe('John')
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'items', '1'], scope })).toBe('a')
        })

        it('returns undefined for missing paths', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'missing', 'deep'], scope })).toBeUndefined()
            expect(propertyPath.resolveValue({ segments: ['step_99'], scope })).toBeUndefined()
        })

        it('reads properties of primitives via boxing', () => {
            expect(propertyPath.resolveValue({ segments: ['step_1', 'output', 'name', 'length'], scope })).toBe(4)
        })
    })
})
