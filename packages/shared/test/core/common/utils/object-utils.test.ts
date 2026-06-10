import {
    applyFunctionToValuesSync,
    applyFunctionToValues,
    sanitizeObjectForPostgresql,
    groupBy,
    omit,
    deleteProperties,
    deleteProps,
    spreadIfNotUndefined,
    spreadIfDefined,
    isObject,
} from '../../../../src/lib/core/common/utils/object-utils'

describe('applyFunctionToValuesSync', () => {
    it('should apply function to string values in nested objects', () => {
        const result = applyFunctionToValuesSync<Record<string, unknown>>(
            { a: 'hello', b: { c: 'world' } },
            (str) => str.toUpperCase(),
        )
        expect(result).toEqual({ a: 'HELLO', b: { c: 'WORLD' } })
    })

    it('should apply function to strings inside arrays', () => {
        const result = applyFunctionToValuesSync<string[]>(
            ['a', 'b'],
            (str) => str.toUpperCase(),
        )
        expect(result).toEqual(['A', 'B'])
    })

    it('should return null/undefined as-is', () => {
        expect(applyFunctionToValuesSync(null, (s) => s)).toBeNull()
        expect(applyFunctionToValuesSync(undefined, (s) => s)).toBeUndefined()
    })

    it('should return non-string primitives unchanged', () => {
        expect(applyFunctionToValuesSync<number>(42, (s) => s)).toBe(42)
        expect(applyFunctionToValuesSync<boolean>(true, (s) => s)).toBe(true)
    })
})

describe('applyFunctionToValues', () => {
    it('should apply async function to string values', async () => {
        const result = await applyFunctionToValues<Record<string, unknown>>(
            { a: 'hello', nested: { b: 'world' } },
            async (str) => str.toUpperCase(),
        )
        expect(result).toEqual({ a: 'HELLO', nested: { b: 'WORLD' } })
    })

    it('should handle arrays with async function', async () => {
        const result = await applyFunctionToValues<string[]>(
            ['x', 'y'],
            async (str) => str + '!',
        )
        expect(result).toEqual(['x!', 'y!'])
    })
})

describe('sanitizeObjectForPostgresql', () => {
    it('should remove null characters from strings', () => {
        const result = sanitizeObjectForPostgresql({ text: 'hello\u0000world' })
        expect(result).toEqual({ text: 'helloworld' })
    })

    it('should handle nested objects with null characters', () => {
        const result = sanitizeObjectForPostgresql({ a: { b: 'te\u0000st' } })
        expect(result).toEqual({ a: { b: 'test' } })
    })
})

describe('groupBy', () => {
    it('should group items by key selector', () => {
        const items = [
            { type: 'a', value: 1 },
            { type: 'b', value: 2 },
            { type: 'a', value: 3 },
        ]
        const result = groupBy(items, (item) => item.type)
        expect(result).toEqual({
            a: [{ type: 'a', value: 1 }, { type: 'a', value: 3 }],
            b: [{ type: 'b', value: 2 }],
        })
    })

    it('should return empty object for empty array', () => {
        expect(groupBy([], () => 'key')).toEqual({})
    })
})

describe('omit', () => {
    it('should omit specified keys', () => {
        const result = omit({ a: 1, b: 2, c: 3 }, ['b', 'c'])
        expect(result).toEqual({ a: 1 })
    })
})

describe('deleteProperties', () => {
    it('should delete specified properties and return a new object', () => {
        const original = { a: 1, b: 2, c: 3 }
        const result = deleteProperties(original, ['b'])
        expect(result).toEqual({ a: 1, c: 3 })
        expect(original).toEqual({ a: 1, b: 2, c: 3 })
    })
})

describe('deleteProps', () => {
    it('should delete specified props and return a new object', () => {
        const original = { x: 10, y: 20, z: 30 }
        const result = deleteProps(original, ['y'])
        expect(result).toEqual({ x: 10, z: 30 })
        expect(original).toEqual({ x: 10, y: 20, z: 30 })
    })
})

describe('spreadIfNotUndefined', () => {
    it('should return key-value pair when value is defined', () => {
        expect(spreadIfNotUndefined('key', 'value')).toEqual({ key: 'value' })
    })

    it('should return empty object when value is undefined', () => {
        expect(spreadIfNotUndefined('key', undefined)).toEqual({})
    })

    it('should pass null through (only checks === undefined)', () => {
        expect(spreadIfNotUndefined('key', null)).toEqual({ key: null })
    })
})

describe('spreadIfDefined', () => {
    it('should return key-value pair when value is defined', () => {
        expect(spreadIfDefined('key', 'value')).toEqual({ key: 'value' })
    })

    it('should return empty object for undefined', () => {
        expect(spreadIfDefined('key', undefined)).toEqual({})
    })

    it('should return empty object for null (filters both null and undefined)', () => {
        expect(spreadIfDefined('key', null)).toEqual({})
    })
})

describe('isObject', () => {
    it('should return true for plain objects', () => {
        expect(isObject({})).toBe(true)
        expect(isObject({ a: 1 })).toBe(true)
    })

    it('should return false for arrays', () => {
        expect(isObject([])).toBe(false)
    })

    it('should return false for null', () => {
        expect(isObject(null)).toBe(false)
    })

    it('should return false for primitives', () => {
        expect(isObject('string')).toBe(false)
        expect(isObject(42)).toBe(false)
    })
})
