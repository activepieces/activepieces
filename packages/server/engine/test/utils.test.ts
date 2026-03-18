import { utils } from '../src/lib/utils'

describe('utils.sizeof', () => {
    it('should return correct size for a simple string', () => {
        const str = 'hello'
        expect(utils.sizeof(str)).toBe(Buffer.byteLength(JSON.stringify(str), 'utf8'))
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
        const obj = { key: 'value', num: 123, nested: { a: true } }
        expect(utils.sizeof(obj)).toBe(Buffer.byteLength(JSON.stringify(obj), 'utf8'))
    })

    it('should return correct size for multi-byte UTF-8 characters', () => {
        const str = 'héllo 🌍'
        expect(utils.sizeof(str)).toBe(Buffer.byteLength(JSON.stringify(str), 'utf8'))
    })

    it('should match JSON serialized byte length for complex data', () => {
        const data = {
            steps: {
                step1: { input: { url: 'https://example.com' }, output: { status: 200, body: 'x'.repeat(1000) } },
                step2: { input: { items: [1, 2, 3] }, output: null },
            },
        }
        expect(utils.sizeof(data)).toBe(Buffer.byteLength(JSON.stringify(data), 'utf8'))
    })
})
