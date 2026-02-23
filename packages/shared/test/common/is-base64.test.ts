import { isBase64 } from '../../src/lib/common/utils/utils'

const validBase64 = 'SGVsbG8gV29ybGQ='  // "Hello World"
const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const pngDataUri = `data:image/png;base64,${validPngBase64}`

describe('isBase64', () => {
    describe('without options', () => {
        it('should return true for valid base64 string', () => {
            expect(isBase64(validBase64)).toBe(true)
        })
        it('should return true for PNG encoded as base64', () => {
            expect(isBase64(validPngBase64)).toBe(true)
        })
        it('should return true for base64 with two padding chars', () => {
            expect(isBase64('uuLMhh==')).toBe(true)
        })
        it('should return false for data URI when allowMime is not set', () => {
            expect(isBase64(pngDataUri)).toBe(false)
        })
        it('should return false for string with invalid characters', () => {
            expect(isBase64('afQ$%rfew')).toBe(false)
        })
        it('should return false for string whose length is not a multiple of 4', () => {
            expect(isBase64('abc')).toBe(false)
        })
        it('should return false for string with misplaced padding character', () => {
            expect(isBase64('ab=c')).toBe(false)
        })
        it('should return false for empty string', () => {
            expect(isBase64('')).toBe(false)
        })
    })

    describe('with allowMime option', () => {
        it('should return true for PNG data URI', () => {
            expect(isBase64(pngDataUri, { allowMime: true })).toBe(true)
        })
        it('should return true for JPEG data URI', () => {
            expect(isBase64(`data:image/jpeg;base64,${validPngBase64}`, { allowMime: true })).toBe(true)
        })
        it('should return true for MIME type containing + character', () => {
            expect(isBase64(`data:image/svg+xml;base64,${validPngBase64}`, { allowMime: true })).toBe(true)
        })
        it('should return true for MIME type containing - character', () => {
            expect(isBase64(`data:application/set-payment;base64,${validPngBase64}`, { allowMime: true })).toBe(true)
        })
        it('should return true for MIME type containing . character', () => {
            expect(isBase64(`data:image/vnd.adobe.photoshop;base64,${validPngBase64}`, { allowMime: true })).toBe(true)
        })
        it('should return true for plain base64 string when allowMime is set', () => {
            expect(isBase64(validBase64, { allowMime: true })).toBe(true)
        })
        it('should return false for data URI with invalid base64 payload', () => {
            expect(isBase64('data:image/png;base64,!!invalid$$', { allowMime: true })).toBe(false)
        })
        it('should return false for HTTP URL', () => {
            expect(isBase64('https://example.com/image.png', { allowMime: true })).toBe(false)
        })
        it('should return false for empty string', () => {
            expect(isBase64('', { allowMime: true })).toBe(false)
        })
    })

    describe('non-string inputs', () => {
        it('should return false for null', () => {
            expect(isBase64(null)).toBe(false)
        })
        it('should return false for undefined', () => {
            expect(isBase64(undefined)).toBe(false)
        })
        it('should return false for number', () => {
            expect(isBase64(42)).toBe(false)
        })
        it('should return false for boolean', () => {
            expect(isBase64(true)).toBe(false)
        })
        it('should return false for object', () => {
            expect(isBase64({})).toBe(false)
        })
    })
})
