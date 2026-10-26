import { isFallbackWorthy, toError } from '@activepieces/core-utils'
import { APICallError, RetryError } from 'ai'
import { describe, expect, it } from 'vitest'
import { aiProviderSignal } from '../src/ai-provider-signal'

function rateLimited(): APICallError {
    return new APICallError({
        message: 'Rate limit reached',
        url: 'https://api.openai.com/v1/chat/completions',
        requestBodyValues: {},
        statusCode: 429,
        responseBody: '{"error":"rate_limit"}',
        isRetryable: true,
    })
}

describe('aiProviderSignal.fromError', () => {
    it('reads the provider status out of a retry error', () => {
        const error = new RetryError({ message: 'Failed after 2 attempts', reason: 'maxRetriesExceeded', errors: [rateLimited(), rateLimited()] })
        expect(aiProviderSignal.fromError(error)).toEqual({
            statusCode: 429,
            body: '{"error":"rate_limit"}',
            message: 'Rate limit reached',
            retryable: true,
            fromProvider: true,
        })
    })

    it('looks through a wrapping error to the provider failure', () => {
        const error = new Error('Failed to extract structured data: rate limited', { cause: rateLimited() })
        expect(aiProviderSignal.fromError(error)).toMatchObject({ statusCode: 429, fromProvider: true })
    })

    it('keeps a network failure retryable even without a status', () => {
        const error = new APICallError({
            message: 'Cannot connect to API: connect ECONNREFUSED 10.0.0.1:443',
            url: 'https://llm.internal/v1',
            requestBodyValues: {},
            isRetryable: true,
        })
        expect(aiProviderSignal.fromError(error)).toMatchObject({ retryable: true, fromProvider: true })
        expect(aiProviderSignal.fromError(error).statusCode).toBeUndefined()
    })

    it('marks our own errors as not coming from the provider', () => {
        expect(aiProviderSignal.fromError(new Error('Unable to classify the text into the provided categories.'))).toMatchObject({ fromProvider: false })
    })
})

describe('a provider failure that is not an Error', () => {
    it.each([
        ['statusCode, the shape the ai sdk uses', { statusCode: 503, responseBody: '{"error":"upstream unavailable"}' }],
        ['status, the shape a client library uses', { status: 503, body: '{"error":"upstream unavailable"}' }],
    ])('keeps the status of a plain object carrying %s', (_name, raw) => {
        const signal = aiProviderSignal.fromError(toError(raw))
        expect(signal.statusCode).toBe(503)
        expect(isFallbackWorthy(signal)).toBe(true)
    })

    it('never reports a provider failure as [object Object]', () => {
        const signal = aiProviderSignal.fromError(toError({ error: { message: 'upstream unavailable' } }))
        expect(signal.message).not.toContain('[object Object]')
        expect(signal.message).toContain('upstream unavailable')
    })

    it('still turns a bare string into a readable message', () => {
        expect(aiProviderSignal.fromError(toError('stream dropped')).message).toBe('stream dropped')
    })
})
