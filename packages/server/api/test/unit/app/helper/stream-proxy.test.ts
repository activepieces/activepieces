import { describe, expect, it } from 'vitest'
import { filterResponseHeaders } from '../../../../src/app/helper/stream-proxy'

describe('filterResponseHeaders', () => {
    it('allows content-type through', () => {
        const result = filterResponseHeaders({ 'content-type': 'application/json' })
        expect(result['content-type']).toBe('application/json')
    })

    it('allows content-length through', () => {
        const result = filterResponseHeaders({ 'content-length': '512' })
        expect(result['content-length']).toBe('512')
    })

    it('allows transfer-encoding through', () => {
        const result = filterResponseHeaders({ 'transfer-encoding': 'chunked' })
        expect(result['transfer-encoding']).toBe('chunked')
    })

    it('allows cache-control through', () => {
        const result = filterResponseHeaders({ 'cache-control': 'no-cache' })
        expect(result['cache-control']).toBe('no-cache')
    })

    it('allows date through', () => {
        const result = filterResponseHeaders({ date: 'Mon, 01 Jan 2024 00:00:00 GMT' })
        expect(result['date']).toBe('Mon, 01 Jan 2024 00:00:00 GMT')
    })

    it('filters out disallowed headers like x-powered-by', () => {
        const result = filterResponseHeaders({ 'x-powered-by': 'Express' })
        expect(result['x-powered-by']).toBeUndefined()
    })

    it('filters out set-cookie', () => {
        const result = filterResponseHeaders({ 'set-cookie': ['session=abc'] })
        expect(result['set-cookie']).toBeUndefined()
    })

    it('filters out authorization headers', () => {
        const result = filterResponseHeaders({ authorization: 'Bearer token' })
        expect(result['authorization']).toBeUndefined()
    })

    it('filters out headers with undefined values', () => {
        const result = filterResponseHeaders({ 'content-type': undefined })
        expect(result['content-type']).toBeUndefined()
    })

    it('is case-insensitive: upper-cased allowed header passes through', () => {
        const result = filterResponseHeaders({ 'Content-Type': 'text/html' })
        expect(result['Content-Type']).toBe('text/html')
    })

    it('is case-insensitive: mixed-case disallowed header is filtered out', () => {
        const result = filterResponseHeaders({ 'X-Custom-Header': 'value' })
        expect(result['X-Custom-Header']).toBeUndefined()
    })

    it('returns only allowed headers when a mix of allowed and disallowed are provided', () => {
        const raw: Record<string, string | string[] | undefined> = {
            'content-type': 'text/event-stream',
            'x-request-id': 'abc-123',
            'transfer-encoding': 'chunked',
            server: 'nginx',
            'cache-control': 'no-store',
        }
        const result = filterResponseHeaders(raw)
        expect(result).toEqual({
            'content-type': 'text/event-stream',
            'transfer-encoding': 'chunked',
            'cache-control': 'no-store',
        })
    })

    it('returns an empty object for an empty input', () => {
        const result = filterResponseHeaders({})
        expect(result).toEqual({})
    })

    it('returns an empty object when all headers are disallowed', () => {
        const result = filterResponseHeaders({
            server: 'Apache',
            via: '1.1 proxy',
            'x-frame-options': 'DENY',
        })
        expect(result).toEqual({})
    })

    it('passes through a string array value for an allowed header', () => {
        const result = filterResponseHeaders({ 'content-type': ['text/plain', 'charset=utf-8'] })
        expect(result['content-type']).toEqual(['text/plain', 'charset=utf-8'])
    })
})
