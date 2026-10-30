import { describe, expect, it } from 'vitest'
import { sanitizeHttpHeaderName, sanitizeHttpHeaders, sanitizeHttpHeaderValue, toSendableHttpBody } from '../src/lib/http-header-utils'

describe('sanitizeHttpHeaderName', () => {
    it('trims surrounding whitespace', () => {
        expect(sanitizeHttpHeaderName('Content-type  ')).toBe('Content-type')
    })

    it('removes characters that are not valid in a header name', () => {
        expect(sanitizeHttpHeaderName('X Custom Header')).toBe('XCustomHeader')
        expect(sanitizeHttpHeaderName('(),/:;<=>?@[]')).toBe('')
    })
})

describe('sanitizeHttpHeaderValue', () => {
    it('keeps a valid value untouched', () => {
        expect(sanitizeHttpHeaderValue({ name: 'X-Request-Id', value: 'abc-123' })).toBe('abc-123')
        expect(sanitizeHttpHeaderValue({ name: 'Content-Type', value: 'text/html; charset=utf-8' })).toBe('text/html; charset=utf-8')
    })

    it('removes CR, LF and other control characters', () => {
        expect(sanitizeHttpHeaderValue({ name: 'X-Trace', value: 'abc\r\ndef' })).toBe('abcdef')
        expect(sanitizeHttpHeaderValue({ name: 'X-Trace', value: 'a\u0000b\u007fc' })).toBe('abc')
    })

    it('keeps tabs and Latin-1 characters but drops code points above 0xFF', () => {
        expect(sanitizeHttpHeaderValue({ name: 'X-Name', value: 'a\tb' })).toBe('a\tb')
        expect(sanitizeHttpHeaderValue({ name: 'X-Name', value: 'olá😀' })).toBe('olá')
    })

    it('percent-encodes a Location value instead of dropping characters', () => {
        expect(sanitizeHttpHeaderValue({ name: 'Location', value: 'https://example.com/path\n' })).toBe('https://example.com/path')
        expect(sanitizeHttpHeaderValue({ name: 'location', value: 'https://example.com/olá😀?x=1' })).toBe('https://example.com/ol%C3%A1%F0%9F%98%80?x=1')
        expect(sanitizeHttpHeaderValue({ name: 'Location', value: 'https://example.com/a b' })).toBe('https://example.com/a%20b')
    })

    it('keeps an already encoded Location as is', () => {
        expect(sanitizeHttpHeaderValue({ name: 'Location', value: 'https://example.com/a%20b?q=1&r=2' })).toBe('https://example.com/a%20b?q=1&r=2')
    })

    it('drops a lone surrogate from a Location value', () => {
        expect(sanitizeHttpHeaderValue({ name: 'Location', value: 'https://example.com/\uD800x' })).toBe('https://example.com/x')
    })
})

describe('sanitizeHttpHeaders', () => {
    it('returns an empty object when there are no headers', () => {
        expect(sanitizeHttpHeaders(undefined)).toEqual({})
    })

    it('sanitizes names and values and drops headers left without a name', () => {
        expect(sanitizeHttpHeaders({
            'Content-type  ': 'text/plain',
            'X-Trace': 'abc\r\ndef',
            '(),/': 'ignored',
            'X-Ok': 'ok',
        })).toEqual({
            'Content-type': 'text/plain',
            'X-Trace': 'abcdef',
            'X-Ok': 'ok',
        })
    })
})

describe('toSendableHttpBody', () => {
    it('keeps strings, bytes and empty bodies as they are', () => {
        const bytes = new Uint8Array([1, 2])
        expect(toSendableHttpBody({ body: '<a>1</a>', headers: { 'Content-Type': 'application/xml' } })).toBe('<a>1</a>')
        expect(toSendableHttpBody({ body: bytes, headers: { 'Content-Type': 'application/octet-stream' } })).toBe(bytes)
        expect(toSendableHttpBody({ body: undefined, headers: { 'Content-Type': 'text/plain' } })).toBeUndefined()
    })

    it('leaves objects for the JSON serializer when the content type is JSON or missing', () => {
        const body = { a: 1 }
        expect(toSendableHttpBody({ body, headers: {} })).toBe(body)
        expect(toSendableHttpBody({ body, headers: { 'content-type': 'application/vnd.api+json' } })).toBe(body)
    })

    it('serializes objects and other values when the content type is not JSON', () => {
        expect(toSendableHttpBody({ body: { case: 'C4' }, headers: { 'Content-Type': 'text/plain' } })).toBe('{"case":"C4"}')
        expect(toSendableHttpBody({ body: 42, headers: { 'Content-Type': 'text/plain' } })).toBe('42')
    })
})
