import {
    setAtPath,
    kebabCase,
    camelCase,
    startCase,
    isEmpty,
    chunk,
    partition,
    unique,
    mapsAreSame,
    validateIndexBound,
    pickBy,
    isEnumValue,
    insertAt,
    isNil,
    isString,
    parseToJsonIfPossible,
} from '../../../../src/lib/core/common/utils/utils'

describe('setAtPath', () => {
    it('should set a value at a dot-separated path', () => {
        const obj: Record<string, unknown> = {}
        setAtPath(obj, 'a.b.c', 42)
        expect((obj as Record<string, Record<string, Record<string, number>>>).a.b.c).toBe(42)
    })

    it('should set a value at a bracket notation path', () => {
        const obj: Record<string, unknown> = { items: [0, 0, 0] }
        setAtPath(obj, 'items[1]', 99)
        expect((obj as Record<string, number[]>).items[1]).toBe(99)
    })

    it('should set a value using an array path', () => {
        const obj: Record<string, unknown> = {}
        setAtPath(obj, ['x', 'y'], 'hello')
        expect((obj as Record<string, Record<string, string>>).x.y).toBe('hello')
    })
})

describe('kebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
        expect(kebabCase('myVariableName')).toBe('my-variable-name')
    })

    it('should convert spaces to hyphens', () => {
        expect(kebabCase('hello world')).toBe('hello-world')
    })

    it('should convert underscores to hyphens', () => {
        expect(kebabCase('hello_world')).toBe('hello-world')
    })

    it('should remove leading and trailing hyphens', () => {
        expect(kebabCase('_hello_')).toBe('hello')
    })
})

describe('camelCase', () => {
    it('should convert kebab-case to camelCase', () => {
        expect(camelCase('my-variable')).toBe('myVariable')
    })

    it('should convert snake_case to camelCase', () => {
        expect(camelCase('my_variable')).toBe('myVariable')
    })

    it('should only transform [-_][a-z] patterns, preserving leading uppercase', () => {
        expect(camelCase('MyComponent')).toBe('MyComponent')
    })
})

describe('startCase', () => {
    it('should convert camelCase to Start Case', () => {
        expect(startCase('helloWorld')).toBe('Hello World')
    })

    it('should convert snake_case to Start Case', () => {
        expect(startCase('hello_world')).toBe('Hello World')
    })
})

describe('isEmpty', () => {
    it('should return true for null and undefined', () => {
        expect(isEmpty(null)).toBe(true)
        expect(isEmpty(undefined)).toBe(true)
    })

    it('should return true for empty string', () => {
        expect(isEmpty('')).toBe(true)
    })

    it('should return false for non-empty string', () => {
        expect(isEmpty('hello')).toBe(false)
    })

    it('should return true for empty array', () => {
        expect(isEmpty([])).toBe(true)
    })

    it('should return false for non-empty array', () => {
        expect(isEmpty([1])).toBe(false)
    })

    it('should return true for empty object', () => {
        expect(isEmpty({})).toBe(true)
    })

    it('should return false for non-empty object', () => {
        expect(isEmpty({ a: 1 })).toBe(false)
    })

    it('should return false for 0 and false (non-container types)', () => {
        expect(isEmpty(0)).toBe(false)
        expect(isEmpty(false)).toBe(false)
    })
})

describe('chunk', () => {
    it('should split an array into chunks of specified size', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    })

    it('should return empty array for empty input', () => {
        expect(chunk([], 3)).toEqual([])
    })
})

describe('partition', () => {
    it('should split array into truthy and falsy groups', () => {
        const [even, odd] = partition([1, 2, 3, 4], (n) => n % 2 === 0)
        expect(even).toEqual([2, 4])
        expect(odd).toEqual([1, 3])
    })
})

describe('unique', () => {
    it('should deduplicate primitives', () => {
        expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3])
    })

    it('should deduplicate objects using JSON.stringify', () => {
        expect(unique([{ a: 1 }, { a: 1 }, { a: 2 }])).toEqual([{ a: 1 }, { a: 2 }])
    })
})

describe('mapsAreSame', () => {
    it('should return true for equal maps', () => {
        const a = new Map([['x', 1], ['y', 2]])
        const b = new Map([['x', 1], ['y', 2]])
        expect(mapsAreSame(a, b)).toBe(true)
    })

    it('should return false for maps with different sizes', () => {
        const a = new Map([['x', 1]])
        const b = new Map([['x', 1], ['y', 2]])
        expect(mapsAreSame(a, b)).toBe(false)
    })

    it('should return false for maps with different values', () => {
        const a = new Map([['x', 1]])
        const b = new Map([['x', 2]])
        expect(mapsAreSame(a, b)).toBe(false)
    })
})

describe('validateIndexBound', () => {
    it('should clamp negative index to 0', () => {
        expect(validateIndexBound({ index: -5, limit: 10 })).toBe(0)
    })

    it('should clamp index >= limit to limit - 1', () => {
        expect(validateIndexBound({ index: 10, limit: 5 })).toBe(4)
    })

    it('should return index when within bounds', () => {
        expect(validateIndexBound({ index: 3, limit: 10 })).toBe(3)
    })
})

describe('pickBy', () => {
    it('should pick entries matching the predicate', () => {
        const result = pickBy({ a: 1, b: null, c: 3 } as Record<string, unknown>, (val) => val !== null)
        expect(result).toEqual({ a: 1, c: 3 })
    })
})

describe('isEnumValue', () => {
    enum Color {
        Red = 'RED',
        Blue = 'BLUE',
    }

    it('should return true for valid enum values', () => {
        expect(isEnumValue(Color, 'RED')).toBe(true)
    })

    it('should return false for invalid enum values', () => {
        expect(isEnumValue(Color, 'GREEN')).toBe(false)
    })
})

describe('insertAt', () => {
    it('should insert an item at the given index without mutating the original', () => {
        const original = [1, 2, 3]
        const result = insertAt(original, 1, 99)
        expect(result).toEqual([1, 99, 2, 3])
        expect(original).toEqual([1, 2, 3])
    })
})

describe('isNil', () => {
    it('should return true for null and undefined', () => {
        expect(isNil(null)).toBe(true)
        expect(isNil(undefined)).toBe(true)
    })

    it('should return false for other values', () => {
        expect(isNil(0)).toBe(false)
        expect(isNil('')).toBe(false)
        expect(isNil(false)).toBe(false)
    })
})

describe('isString', () => {
    it('should return true for strings', () => {
        expect(isString('hello')).toBe(true)
        expect(isString('')).toBe(true)
    })

    it('should return false for non-strings', () => {
        expect(isString(123)).toBe(false)
        expect(isString(null)).toBe(false)
        expect(isString(undefined)).toBe(false)
    })
})

describe('parseToJsonIfPossible', () => {
    it('should parse valid JSON strings', () => {
        expect(parseToJsonIfPossible('{"a":1}')).toEqual({ a: 1 })
    })

    it('should return the original value for invalid JSON', () => {
        expect(parseToJsonIfPossible('not json')).toBe('not json')
    })

    it('should return non-string values as-is', () => {
        expect(parseToJsonIfPossible(42)).toBe(42)
    })
})
