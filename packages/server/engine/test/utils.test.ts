import { utils } from '../src/lib/utils'

describe('utils.sizeof', () => {
    it('should return correct size for a simple string', () => {
        // "hello" = 7 bytes (5 chars + 2 quotes)
        expect(utils.sizeof('hello')).toBe(7)
    })

    it('should return correct size for a number', () => {
        expect(utils.sizeof(42)).toBe(2)
        expect(utils.sizeof(12345)).toBe(5)
        expect(utils.sizeof(1.5)).toBe(3)
    })

    it('should return correct size for booleans', () => {
        expect(utils.sizeof(true)).toBe(4)
        expect(utils.sizeof(false)).toBe(5)
    })

    it('should return correct size for null', () => {
        expect(utils.sizeof(null)).toBe(4)
    })

    it('should return correct size for an empty object', () => {
        expect(utils.sizeof({})).toBe(2)
    })

    it('should return correct size for an empty array', () => {
        expect(utils.sizeof([])).toBe(2)
    })

    it('should return correct size for a nested object', () => {
        // {"key":"value","num":123,"nested":{"a":true}} = 45 bytes
        const obj = { key: 'value', num: 123, nested: { a: true } }
        expect(utils.sizeof(obj)).toBe(45)
    })

    it('should return correct size for multi-byte UTF-8 characters', () => {
        // "héllo 🌍" — é is 2 UTF-8 bytes, 🌍 is 4 UTF-8 bytes, 4 ASCII chars + space = 5, quotes = 2 → 13
        expect(utils.sizeof('héllo 🌍')).toBe(13)
    })

    it('should return correct size for complex nested data', () => {
        // {"a":{"b":[1,2,3]},"c":"x"} = 27 bytes
        const data = { a: { b: [1, 2, 3] }, c: 'x' }
        expect(utils.sizeof(data)).toBe(27)
    })
})
