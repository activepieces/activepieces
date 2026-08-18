import { describe, expect, it } from 'vitest'
import { classifyProviderOutcome } from '../src/lib/ai-provider-health'

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
