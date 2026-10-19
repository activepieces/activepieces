import { describe, expect, it } from 'vitest'
import { formatPieceError } from '../src/lib/friendly-piece-error'

function httpError({ status, responseBody }: { status: number, responseBody: unknown }): unknown {
    return {
        name: 'HttpError',
        message: 'Request failed',
        response: { status, body: responseBody },
    }
}

describe('formatPieceError api message extraction', () => {
    it('reads the message out of a bare array error body', () => {
        const formatted = formatPieceError(httpError({ status: 400, responseBody: [{ message: 'A public HTTPS URL is required' }] }))

        expect(formatted.apiMessage).toBe('A public HTTPS URL is required')
        expect(formatted.message).toBe('A public HTTPS URL is required')
    })

    it('joins every entry of a multi error array body', () => {
        const formatted = formatPieceError(httpError({ status: 422, responseBody: [{ message: 'name is required' }, { message: 'email is invalid' }] }))

        expect(formatted.apiMessage).toBe('name is required; email is invalid')
    })

    it('reads an array of plain strings', () => {
        const formatted = formatPieceError(httpError({ status: 422, responseBody: ['name is required'] }))

        expect(formatted.apiMessage).toBe('name is required')
    })

    it('leaves apiMessage unset when an array body carries no message', () => {
        const formatted = formatPieceError(httpError({ status: 500, responseBody: [{ code: 42 }] }))

        expect(formatted.apiMessage).toBeUndefined()
    })

    it('still reads a keyed object error body', () => {
        const formatted = formatPieceError(httpError({ status: 401, responseBody: { ok: false, error: 'invalid_auth' } }))

        expect(formatted.apiMessage).toBe('invalid_auth')
    })
})

describe('formatPieceError on cyclic and unbounded error bodies', () => {
    it('terminates on a self referencing array body', () => {
        const body: unknown[] = []
        body.push(body)

        const formatted = formatPieceError(httpError({ status: 500, responseBody: body }))

        expect(formatted.apiMessage).toBeUndefined()
    })

    it('terminates when the message chain points back at itself', () => {
        const body: Record<string, unknown> = {}
        body['message'] = body

        const formatted = formatPieceError(httpError({ status: 500, responseBody: body }))

        expect(formatted.apiMessage).toBeUndefined()
    })

    it('terminates when the cycle runs through a nested error key', () => {
        const body: Record<string, unknown> = {}
        body['error'] = { message: body }

        const formatted = formatPieceError(httpError({ status: 500, responseBody: body }))

        expect(formatted.apiMessage).toBeUndefined()
    })

    it('terminates on a body nested far deeper than any real api returns', () => {
        let body: unknown = 'leaf'
        for (let index = 0; index < 50_000; index++) {
            body = [body]
        }

        const formatted = formatPieceError(httpError({ status: 500, responseBody: body }))

        expect(formatted.apiMessage).toBeUndefined()
    })

    it('terminates on a wide cycle instead of walking it exponentially', () => {
        const body: unknown[] = []
        for (let index = 0; index < 100; index++) {
            body.push(body)
        }

        const startedAt = Date.now()
        const formatted = formatPieceError(httpError({ status: 500, responseBody: body }))

        expect(formatted.apiMessage).toBeUndefined()
        expect(Date.now() - startedAt).toBeLessThan(1000)
    })

    it('still reads the message that sits above a cycle', () => {
        const body: Record<string, unknown> = { message: 'Auth failed' }
        body['self'] = body

        const formatted = formatPieceError(httpError({ status: 401, responseBody: body }))

        expect(formatted.apiMessage).toBe('Auth failed')
    })

    it('returns a payload the engine can always serialize', () => {
        const body: Record<string, unknown> = { message: 'Auth failed' }
        body['self'] = body

        const formatted = formatPieceError(httpError({ status: 401, responseBody: body }))
        const serialized = JSON.stringify(formatted)

        expect(serialized).toContain('[Circular]')
        expect(JSON.parse(serialized).message).toBe('Auth failed')
    })

    it('serializes a request body that points back at its own error', () => {
        const requestBody: Record<string, unknown> = { url: 'https://example.com' }
        requestBody['self'] = requestBody
        const error = {
            name: 'HttpError',
            message: 'boom',
            response: { status: 400, body: { message: 'Bad request' } },
            request: { body: requestBody },
        }

        const formatted = formatPieceError(error)

        expect(() => JSON.stringify(formatted)).not.toThrow()
    })

    it('collects a shared reference once, the cost of being cycle safe', () => {
        const entry = { message: 'name is required' }

        const formatted = formatPieceError(httpError({ status: 422, responseBody: [entry, entry] }))

        expect(formatted.apiMessage).toBe('name is required')
    })
})

describe('formatPieceError never throws while formatting', () => {
    it('keeps a serializable body byte identical rather than rewriting it', () => {
        const responseBody = { at: new Date('2020-01-02T03:04:05Z'), blob: Buffer.from('hi'), nested: [1, 'two', { three: true }] }

        const formatted = formatPieceError(httpError({ status: 400, responseBody }))

        expect(JSON.stringify(formatted.responseBody)).toBe(JSON.stringify(responseBody))
    })

    it('survives a body whose own getter throws', () => {
        const responseBody: Record<string, unknown> = { message: 'Auth failed' }
        responseBody['self'] = responseBody
        Object.defineProperty(responseBody, 'boom', { enumerable: true, get: () => {
            throw new Error('getter exploded')
        } })

        const formatted = formatPieceError(httpError({ status: 401, responseBody }))

        expect(formatted.responseBody).toBe('[Unserializable]')
        expect(() => JSON.stringify(formatted)).not.toThrow()
    })

    it('survives a bigint that plain stringify refuses', () => {
        const formatted = formatPieceError(httpError({ status: 500, responseBody: { count: BigInt(9) } }))

        expect(() => JSON.stringify(formatted)).not.toThrow()
    })
})
