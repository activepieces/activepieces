import { ActivepiecesError, AIProviderName, ErrorCode } from '@activepieces/core-utils'
import { APICallError, RetryError } from 'ai'
import { describe, expect, it } from 'vitest'
import { classifyAgentRunError, isTransientFailureText, looksEmptyResultText } from '../../../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

function apiError({ statusCode, message, responseBody }: { statusCode: number, message: string, responseBody?: string }): APICallError {
    return new APICallError({ message, url: 'https://provider.test/v1/chat', requestBodyValues: {}, statusCode, responseBody })
}

describe('isTransientFailureText', () => {
    it('flags retryable errors (rate limit, 5xx, timeout, dropped socket)', () => {
        for (const t of ['❌ failed: 429 Too Many Requests', '❌ 503 Service Unavailable', '❌ request timed out', '❌ ECONNRESET', '❌ rate limit exceeded']) {
            expect(isTransientFailureText(t), t).toBe(true)
        }
    })

    it('does not flag permanent errors (4xx validation/auth)', () => {
        for (const t of ['❌ Cannot run action: missing required field channel', '❌ 401 unauthorized', '❌ 400 bad request: invalid email']) {
            expect(isTransientFailureText(t), t).toBe(false)
        }
    })
})

describe('looksEmptyResultText', () => {
    it('detects the empty-read shapes the agent kept re-fetching', () => {
        for (const t of ['✅ Find Record completed. {"found":false,"result":[]}', 'Note: empty result. "find_record" returns a SINGLE match', '{"results":[]}']) {
            expect(looksEmptyResultText(t), t).toBe(true)
        }
    })

    it('does not flag a populated result', () => {
        expect(looksEmptyResultText('✅ done {"found":true,"result":[{"id":"r1"}]}')).toBe(false)
    })
})


describe('classifyAgentRunError', () => {
    const classify = (error: unknown, provider?: string): string => classifyAgentRunError({ error, ...(provider === undefined ? {} : { provider }) })
    const notFound = (entityType: string): ActivepiecesError => new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: 'x', entityType } })

    it.each([
        [400, 'internal'], [401, 'user'], [402, 'credit'], [403, 'user'], [404, 'user'], [408, 'internal'],
        [409, 'internal'], [413, 'internal'], [422, 'internal'], [429, 'internal'], [500, 'internal'], [503, 'internal'],
    ])('classifies a provider %i as %s', (statusCode, expected) => {
        expect(classify(apiError({ statusCode, message: 'the provider said no' }))).toBe(expected)
    })

    it.each([
        'Grok 4.1 Fast is deprecated',
        'gemini-2.5-pro is no longer available',
        'the model was decommissioned',
    ])('blames the user for a 400 that names a retired model: %s', (message) => {
        expect(classify(apiError({ statusCode: 400, message }))).toBe('user')
    })

    it('does not read the retired-model marker out of a response body, which carries error pages we did not write', () => {
        expect(classify(apiError({ statusCode: 400, message: 'Bad Request', responseBody: '<html><footer>this endpoint is deprecated</footer></html>' }))).toBe('internal')
    })

    it('never blames the user for a retired model on the managed key, which we chose for them', () => {
        expect(classify(apiError({ statusCode: 400, message: 'Grok 4.1 Fast is deprecated' }), AIProviderName.ACTIVEPIECES)).toBe('internal')
        expect(classify(apiError({ statusCode: 400, message: 'Grok 4.1 Fast is deprecated' }), AIProviderName.OPENROUTER)).toBe('user')
    })

    it('keeps a 400 we caused internal, so an illegal tool name is not laundered as user config', () => {
        expect(classify(apiError({ statusCode: 400, message: "tools.0.name: should match pattern '^[a-zA-Z0-9_.-]{1,64}$'" }))).toBe('internal')
    })

    it('never blames the user for the managed key, which is ours and fails everyone at once', () => {
        for (const statusCode of [401, 403]) {
            expect(classify(apiError({ statusCode, message: 'Unauthorized' }), AIProviderName.ACTIVEPIECES)).toBe('internal')
            expect(classify(apiError({ statusCode, message: 'Unauthorized' }), AIProviderName.OPENAI)).toBe('user')
        }
        expect(classify(apiError({ statusCode: 404, message: 'No endpoints found' }), AIProviderName.ACTIVEPIECES)).toBe('user')
    })

    it('reads billing exhaustion out of a 429 body, which the provider marks retryable', () => {
        expect(classify(apiError({ statusCode: 429, message: 'quota', responseBody: '{"code":"insufficient_quota"}' }))).toBe('credit')
    })

    it('does not let a 5xx error page mentioning credits masquerade as a billing failure', () => {
        expect(classify(apiError({ statusCode: 500, message: 'Bad gateway', responseBody: '<html>Buy more credits</html>' }))).toBe('internal')
        expect(classify(apiError({ statusCode: 503, message: 'Unavailable', responseBody: 'trace-id 402 upstream down' }))).toBe('internal')
    })

    it('reports a real quota rejection as credit, so the client can offer a top-up', () => {
        expect(classify(new Error('You have run out of AI credits'))).toBe('credit')
        expect(classify(new ActivepiecesError({ code: ErrorCode.QUOTA_EXCEEDED, params: { metric: 'credits', quota: 0 } }))).toBe('credit')
    })

    it('unwraps the retry envelope the SDK adds after a retried attempt', () => {
        expect(classify(new RetryError({
            message: 'Failed after 2 attempts',
            reason: 'errorNotRetryable',
            errors: [apiError({ statusCode: 429, message: 'Too Many Requests' }), apiError({ statusCode: 401, message: 'Unauthorized' })],
        }))).toBe('user')
    })

    it('treats a missing AI provider as user config, but any other not-found as our bug', () => {
        expect(classify(notFound('AIProvider'))).toBe('user')
        expect(classify(notFound('ChatAiProvider'))).toBe('user')
        expect(classify(notFound('Conversation'))).toBe('internal')
    })

    it('keeps a conversation stuck mid-stream visible instead of completing quietly', () => {
        expect(classify(new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'An agent is already running for this conversation' } }))).toBe('internal')
    })

    it('reads the error code an RPC failure now carries across the boundary', () => {
        expect(classify(Object.assign(new Error('RPC [getAgentConfig] handler threw: ENTITY_NOT_FOUND'), {
            apError: { code: ErrorCode.ENTITY_NOT_FOUND, entityType: 'AIProvider' },
        }))).toBe('user')
    })

    it('keeps an unrecognised error internal', () => {
        for (const input of [new Error('Cannot read properties of undefined'), undefined, null, 'a string', {}]) {
            expect(classify(input)).toBe('internal')
        }
    })
})
