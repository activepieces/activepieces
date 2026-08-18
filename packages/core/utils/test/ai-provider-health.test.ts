import { describe, expect, it, vi } from 'vitest'
import { classifyProviderOutcome, observedProviderFetch, ProviderOutcomeSignal } from '../src/lib/ai-provider-health'

describe('classifyProviderOutcome', () => {
    it('reads a 2xx as a working key', () => {
        expect(classifyProviderOutcome({ statusCode: 200 })).toBe('active')
        expect(classifyProviderOutcome({ statusCode: 204 })).toBe('active')
    })

    it('separates a rejected secret from a provider outage', () => {
        expect(classifyProviderOutcome({ statusCode: 401 })).toBe('rejected')
        expect(classifyProviderOutcome({ statusCode: 403 })).toBe('rejected')
        expect(classifyProviderOutcome({ statusCode: 500 })).toBe('unreachable')
        expect(classifyProviderOutcome({ statusCode: 503 })).toBe('unreachable')
        expect(classifyProviderOutcome({ statusCode: 408 })).toBe('unreachable')
    })

    it('reads an explicit 402 as the provider billing', () => {
        expect(classifyProviderOutcome({ statusCode: 402, body: 'Insufficient credits' })).toBe('out_of_credits')
    })

    // The case the message-regex on main gets wrong: OpenAI bills through 429 and the message
    // carries neither "credits" nor "402", so today it is treated as transient and retried.
    it('reads OpenAI insufficient_quota as out of credits, not as a rate limit', () => {
        const outcome = classifyProviderOutcome({
            statusCode: 429,
            body: '{"error":{"message":"You exceeded your current quota, please check your plan and billing details.","type":"insufficient_quota","code":"insufficient_quota"}}',
        })
        expect(outcome).toBe('out_of_credits')
    })

    it('reads Anthropic credit_balance_too_low as out of credits', () => {
        const outcome = classifyProviderOutcome({
            statusCode: 400,
            body: '{"error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API."}}',
        })
        expect(outcome).toBe('out_of_credits')
    })

    it('leaves the status alone for a plain rate limit', () => {
        const outcome = classifyProviderOutcome({
            statusCode: 429,
            body: '{"error":{"message":"Rate limit reached for gpt-4o","type":"requests","code":"rate_limit_exceeded"}}',
        })
        expect(outcome).toBe('no_change')
    })

    it('leaves the status alone when only one model is missing', () => {
        const outcome = classifyProviderOutcome({
            statusCode: 404,
            body: '{"error":{"message":"The model `gpt-5-turbo` does not exist","code":"model_not_found"}}',
        })
        expect(outcome).toBe('no_change')
    })

    it('leaves the status alone for a bad request, which is the caller\'s fault', () => {
        expect(classifyProviderOutcome({ statusCode: 400, body: 'invalid temperature' })).toBe('no_change')
        expect(classifyProviderOutcome({ statusCode: 422, body: 'unprocessable' })).toBe('no_change')
    })

    describe('without a status code, falling back to the message', () => {
        it('still catches credit exhaustion', () => {
            expect(classifyProviderOutcome({ message: 'You are out of credits' })).toBe('out_of_credits')
            expect(classifyProviderOutcome({ message: 'HTTP 402 payment required' })).toBe('out_of_credits')
        })

        it('holds the status for a transient failure', () => {
            expect(classifyProviderOutcome({ message: '429 rate limit exceeded' })).toBe('no_change')
            expect(classifyProviderOutcome({ message: 'socket hang up' })).toBe('no_change')
            expect(classifyProviderOutcome({ message: 'ETIMEDOUT' })).toBe('no_change')
        })

        it('treats an unrecognised failure as unreachable', () => {
            expect(classifyProviderOutcome({ message: 'getaddrinfo ENOTFOUND api.openai.com' })).toBe('unreachable')
        })

        it('holds the status when there is nothing to go on', () => {
            expect(classifyProviderOutcome({})).toBe('no_change')
            expect(classifyProviderOutcome({ message: '' })).toBe('no_change')
        })
    })
})

describe('observedProviderFetch', () => {
    const withFetch = async (impl: () => Promise<Response>): Promise<ProviderOutcomeSignal[]> => {
        const signals: ProviderOutcomeSignal[] = []
        const original = globalThis.fetch
        globalThis.fetch = vi.fn(impl) as unknown as typeof globalThis.fetch
        try {
            const observed = observedProviderFetch((signal) => signals.push(signal))
            expect(observed).toBeDefined()
            await observed?.('https://api.openai.com/v1/models')
            await new Promise((resolve) => setImmediate(resolve))
        }
        finally {
            globalThis.fetch = original
        }
        return signals
    }

    it('returns the provider response even when the body cannot be read', async () => {
        const response = new Response('nope', { status: 401 })
        vi.spyOn(response, 'clone').mockImplementation(() => {
            throw new Error('body already disturbed')
        })
        const signals = await withFetch(async () => response)
        expect(signals).toEqual([{ statusCode: 401 }])
    })

    it('never reads the body of a streaming success', async () => {
        const response = new Response('hello', { status: 200 })
        const clone = vi.spyOn(response, 'clone')
        const signals = await withFetch(async () => response)
        expect(clone).not.toHaveBeenCalled()
        expect(signals).toEqual([{ statusCode: 200 }])
        expect(await response.text()).toBe('hello')
    })

    it('caps how much of a failure body it keeps', async () => {
        const signals = await withFetch(async () => new Response('x'.repeat(5000), { status: 429 }))
        expect(signals[0].statusCode).toBe(429)
        expect(signals[0].body).toHaveLength(2000)
    })

    it('reports a transport failure and rethrows it untouched', async () => {
        const boom = new Error('socket hang up')
        const signals: ProviderOutcomeSignal[] = []
        const original = globalThis.fetch
        globalThis.fetch = vi.fn(async () => {
            throw boom
        }) as unknown as typeof globalThis.fetch
        try {
            const observed = observedProviderFetch((signal) => signals.push(signal))
            await expect(observed?.('https://api.openai.com/v1/models')).rejects.toBe(boom)
            await new Promise((resolve) => setImmediate(resolve))
        }
        finally {
            globalThis.fetch = original
        }
        expect(signals[0].message).toContain('socket hang up')
    })

    it('reports a retry sequence in the order the responses arrived', async () => {
        const failure = new Response('{"error":"overloaded"}', { status: 500 })
        const slowBody = new Response('{"error":"overloaded"}', { status: 500 })
        vi.spyOn(slowBody, 'text').mockReturnValue(new Promise((resolve) => setTimeout(() => resolve('{"error":"overloaded"}'), 20)))
        vi.spyOn(failure, 'clone').mockReturnValue(slowBody)
        const responses = [failure, new Response('{}', { status: 200 })]

        const signals: ProviderOutcomeSignal[] = []
        const original = globalThis.fetch
        globalThis.fetch = vi.fn(async () => responses.shift()!) as unknown as typeof globalThis.fetch
        try {
            const observed = observedProviderFetch((signal) => signals.push(signal))
            await observed?.('https://api.openai.com/v1/chat/completions')
            await observed?.('https://api.openai.com/v1/chat/completions')
            await new Promise((resolve) => setTimeout(resolve, 60))
        }
        finally {
            globalThis.fetch = original
        }

        expect(signals.map((signal) => signal.statusCode)).toEqual([500, 200])
    })

    it('keeps a slow reporter off the call path', async () => {
        const signals: ProviderOutcomeSignal[] = []
        const original = globalThis.fetch
        globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof globalThis.fetch
        try {
            const observed = observedProviderFetch(async (signal) => {
                await new Promise((resolve) => setTimeout(resolve, 50))
                signals.push(signal)
            })
            await observed?.('https://api.openai.com/v1/models')
            expect(signals).toEqual([])
            await new Promise((resolve) => setTimeout(resolve, 90))
        }
        finally {
            globalThis.fetch = original
        }
        expect(signals).toEqual([{ statusCode: 200 }])
    })
})
