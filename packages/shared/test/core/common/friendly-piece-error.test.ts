import { formatPieceError, tryParseFriendlyPieceError } from '../../../src/lib/core/common/friendly-piece-error'

class TestHttpError extends Error {
    constructor(public readonly response: { status: number, body: unknown, headers?: Record<string, unknown> }, public readonly request: { body?: unknown, url?: string, method?: string }) {
        super(JSON.stringify({ response, request }))
        this.name = 'HttpError'
    }
}

describe('formatPieceError', () => {
    it('extracts status, request, response, and apiMessage from a Jira-style 403 HttpError', () => {
        const error = new TestHttpError(
            {
                status: 403,
                body: {
                    errorMessages: ['You are not authorized to perform this action. Administrator privileges are required.'],
                    errors: {},
                },
            },
            {
                body: { queries: [{ query: "created > '1970-01-01 02:00'" }] },
            },
        )

        const result = formatPieceError(error)

        expect(result.status).toBe(403)
        expect(result.errorName).toBe('HttpError')
        expect(result.apiMessage).toBe('You are not authorized to perform this action. Administrator privileges are required.')
        expect(result.message).toBe('You are not authorized to perform this action. Administrator privileges are required.')
        expect(result.responseBody).toEqual({
            errorMessages: ['You are not authorized to perform this action. Administrator privileges are required.'],
            errors: {},
        })
        expect(result.requestBody).toEqual({ queries: [{ query: "created > '1970-01-01 02:00'" }] })
    })

    it('extracts apiMessage from a 401 with { message } body (Slack / generic style)', () => {
        const error = new TestHttpError(
            { status: 401, body: { ok: false, error: 'invalid_auth', message: 'Invalid auth token' } },
            { body: {} },
        )

        const result = formatPieceError(error)

        expect(result.status).toBe(401)
        expect(result.apiMessage).toBe('Invalid auth token')
    })

    it('extracts apiMessage from a 422 with { errors: [{ message }] } body', () => {
        const error = new TestHttpError(
            { status: 422, body: { errors: [{ message: 'name is required' }, { message: 'email is invalid' }] } },
            { body: {} },
        )

        const result = formatPieceError(error)

        expect(result.status).toBe(422)
        expect(result.apiMessage).toBe('name is required; email is invalid')
    })

    it('extracts apiMessage from an OAuth-style { error_description } body', () => {
        const error = new TestHttpError(
            { status: 400, body: { error: 'invalid_grant', error_description: 'The provided authorization grant is invalid' } },
            { body: {} },
        )

        const result = formatPieceError(error)

        expect(result.status).toBe(400)
        expect(result.apiMessage).toBe('The provided authorization grant is invalid')
    })

    it('handles a 5xx with a string body', () => {
        const error = new TestHttpError(
            { status: 503, body: 'Service Unavailable' },
            { body: {} },
        )

        const result = formatPieceError(error)

        expect(result.status).toBe(503)
        expect(result.apiMessage).toBe('Service Unavailable')
        expect(result.message).toBe('Service Unavailable')
    })

    it('strips HTML markup from Google-style 404 HTML body and surfaces a clean message', () => {
        const html = `<!DOCTYPE html>
<html lang=en>
  <meta charset=utf-8>
  <title>Error 404 (Not Found)!!1</title>
  <style>* { padding: 0 }</style>
  <a href=//www.google.com/><span id=logo aria-label=Google></span></a>
  <p><b>404.</b> <ins>That's an error.</ins>
  <p>The requested URL <code>/v1</code> was not found on this server.  <ins>That's all we know.</ins>`
        const error = new TestHttpError({ status: 404, body: html }, { body: {} })

        const result = formatPieceError(error)

        expect(result.status).toBe(404)
        expect(result.apiMessage).not.toContain('<')
        expect(result.apiMessage).not.toContain('DOCTYPE')
        expect(result.apiMessage).not.toContain('padding')
        expect(result.apiMessage).toContain('Error 404 (Not Found)!!1')
        expect(result.apiMessage).toContain('The requested URL /v1 was not found on this server')
    })

    it('extracts the title when the HTML body has nothing else useful', () => {
        const html = '<!doctype html><html><head><title>Bad Gateway</title></head><body></body></html>'
        const error = new TestHttpError({ status: 502, body: html }, { body: {} })

        const result = formatPieceError(error)

        expect(result.apiMessage).toBe('Bad Gateway')
    })

    it('strips XML wrappers around an error body', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>`
        const error = new TestHttpError({ status: 404, body: xml }, { body: {} })

        const result = formatPieceError(error)

        expect(result.apiMessage).not.toContain('<')
        expect(result.apiMessage).toContain('NoSuchKey')
        expect(result.apiMessage).toContain('The specified key does not exist.')
    })

    it('handles a plain Error and strips the stack trace', () => {
        const error = new Error('Boom')

        const result = formatPieceError(error)

        expect(result.status).toBeUndefined()
        expect(result.message).toBe('Boom')
        expect(result.message).not.toContain('at ')
    })

    it('returns a default message for nil input', () => {
        expect(formatPieceError(null).message).toBe('Unknown error')
        expect(formatPieceError(undefined).message).toBe('Unknown error')
    })

    it('treats a string input as the message, stripping any stack frames', () => {
        const raw = 'HttpError: something went wrong\n    at AxiosHttpClient.<anonymous> (/path.js:83:39)\n    at Generator.throw (<anonymous>)'

        const result = formatPieceError(raw)

        expect(result.message).toBe('HttpError: something went wrong')
        expect(result.message).not.toContain('at ')
    })

    it('returns the input verbatim if it is already a FriendlyPieceError', () => {
        const original = formatPieceError(new TestHttpError({ status: 404, body: { message: 'not found' } }, { body: {} }))
        const second = formatPieceError(original)
        expect(second).toBe(original)
    })

    it('truncates very long API messages', () => {
        const longMessage = 'x'.repeat(5000)
        const error = new TestHttpError({ status: 500, body: { message: longMessage } }, { body: {} })

        const result = formatPieceError(error)

        expect(result.apiMessage?.endsWith('…')).toBe(true)
        expect(result.apiMessage?.length).toBeLessThanOrEqual(2001)
    })

    it('attaches the raw dump when provided in options', () => {
        const error = new Error('Boom')

        const result = formatPieceError(error, { raw: 'Error: Boom\n    at somewhere' })

        expect(result.message).toBe('Boom')
        expect(result.raw).toBe('Error: Boom\n    at somewhere')
    })

    it('does not set raw when no raw option is provided', () => {
        const result = formatPieceError(new Error('Boom'))

        expect(result.raw).toBeUndefined()
    })

    it('truncates a very long raw dump', () => {
        const result = formatPieceError(new Error('Boom'), { raw: 'y'.repeat(20000) })

        expect(result.raw?.endsWith('…[truncated]')).toBe(true)
        expect(result.raw?.length).toBeLessThanOrEqual(16000 + '\n…[truncated]'.length)
    })
})

describe('tryParseFriendlyPieceError', () => {
    it('parses a JSON-stringified FriendlyPieceError', () => {
        const original = formatPieceError(new TestHttpError({ status: 429, body: { message: 'Too many requests' } }, { body: {} }))
        const json = JSON.stringify(original)
        const parsed = tryParseFriendlyPieceError(json)
        expect(parsed).not.toBeNull()
        expect(parsed?.status).toBe(429)
        expect(parsed?.apiMessage).toBe('Too many requests')
    })

    it('returns the value if already a FriendlyPieceError object', () => {
        const original = formatPieceError(new Error('x'))
        expect(tryParseFriendlyPieceError(original)).toEqual(original)
    })

    it('returns null for non-structured strings', () => {
        expect(tryParseFriendlyPieceError('not a friendly error')).toBeNull()
        expect(tryParseFriendlyPieceError('{"foo":"bar"}')).toBeNull()
    })

    it('returns null for nil values', () => {
        expect(tryParseFriendlyPieceError(null)).toBeNull()
        expect(tryParseFriendlyPieceError(undefined)).toBeNull()
    })
})
