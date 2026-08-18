import { z } from 'zod'
import { formatPieceError } from './friendly-piece-error'

// Provider failures arrive as axios errors, fetch errors, AI SDK APICallErrors and plain Errors.
// formatPieceError already normalises all of those into { status, responseBody, message }, which is
// exactly the signal the classifier wants — so narrow through it rather than adding a second
// extractor that would drift from it.
export function toProviderOutcomeSignal(error: unknown): ProviderOutcomeSignal {
    const formatted = formatPieceError(error)
    return {
        ...(formatted.status === undefined ? {} : { statusCode: formatted.status }),
        ...(formatted.responseBody === undefined ? {} : { body: stringifyBody(formatted.responseBody) }),
        message: formatted.apiMessage ?? formatted.message,
    }
}

function stringifyBody(body: unknown): string {
    return typeof body === 'string' ? body : JSON.stringify(body)
}

// Every AI SDK provider factory accepts a `fetch`, so wrapping it is the one place that sees the
// health of the key behind every model call in a process — no call site has to remember to report.
export function observedProviderFetch(onOutcome: ((signal: ProviderOutcomeSignal) => void) | undefined): typeof globalThis.fetch | undefined {
    if (isNil(onOutcome)) {
        return undefined
    }
    return async (input, init) => {
        try {
            const response = await fetch(input, init)
            // Clone before reading: the SDK still needs the body, and a streaming success must not be
            // touched at all. A 2xx is enough to say the key authenticated.
            const body = response.ok ? undefined : await response.clone().text()
            onOutcome({ statusCode: response.status, ...(isNil(body) ? {} : { body }) })
            return response
        }
        catch (error) {
            onOutcome(toProviderOutcomeSignal(error))
            throw error
        }
    }
}

export function isProviderCreditError(text: string): boolean {
    return CREDIT_ERROR_PATTERNS.some((pattern) => pattern.test(text))
}


export function isTransientProviderError(text: string): boolean {
    return TRANSIENT_ERROR_PATTERN.test(text)
}

export function classifyProviderOutcome({ statusCode, body, message }: ProviderOutcomeSignal): AiProviderKeyStatus | NoStatusChange {
    if (!isNil(statusCode)) {
        return classifyByStatus({ statusCode, haystack: `${body ?? ''} ${message ?? ''}` })
    }
    const text = message ?? ''
    if (isProviderCreditError(text)) {
        return 'out_of_credits'
    }
    if (isTransientProviderError(text)) {
        return 'no_change'
    }
    return text.length === 0 ? 'no_change' : 'unreachable'
}

function classifyByStatus({ statusCode, haystack }: { statusCode: number, haystack: string }): AiProviderKeyStatus | NoStatusChange {
    if (statusCode >= 200 && statusCode < 300) {
        return 'active'
    }
    if (statusCode === 401 || statusCode === 403) {
        return 'rejected'
    }
    if (statusCode === 402) {
        return 'out_of_credits'
    }
    // Providers disagree on which code carries a billing failure — OpenAI bills through 429,
    // Anthropic through 400 — so the body decides before the status does.
    if (BILLING_BODY_PATTERN.test(haystack)) {
        return 'out_of_credits'
    }
    // A bare 429 is load, not health, and the SDK has already retried it.
    if (statusCode === 429) {
        return 'no_change'
    }
    // One unavailable model id says nothing about the key that reached it.
    if (statusCode === 404) {
        return MODEL_NOT_FOUND_PATTERN.test(haystack) ? 'no_change' : 'unreachable'
    }
    if (statusCode === 408 || statusCode >= 500) {
        return 'unreachable'
    }
    // 400/422 and friends are the caller's fault, not the key's.
    return 'no_change'
}

function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined
}

const CREDIT_ERROR_PATTERNS = [/credits/i, /\b402\b/, /payment.required/i]

const TRANSIENT_ERROR_PATTERN = /\b(429|5\d\d)\b|rate.?limit|timeout|timed out|temporarily|try again|econnreset|etimedout|socket hang up|service unavailable/i

// OpenAI bills through a 429 insufficient_quota, Anthropic through a 400 whose message reads
// "your credit balance is too low" — so match both the machine codes and the prose, and neither
// carries a 402, which is why a status-only rule is not enough here.
const BILLING_BODY_PATTERN = /insufficient_quota|credit[_ ]balance|billing_hard_limit_reached|billing|quota|\bcredits?\b|out of funds|payment required/i

const MODEL_NOT_FOUND_PATTERN = /model|deployment|engine/i

export const AiProviderKeyStatus = z.enum(['active', 'out_of_credits', 'rejected', 'unreachable'])
export type AiProviderKeyStatus = z.infer<typeof AiProviderKeyStatus>

export type NoStatusChange = 'no_change'

export type ProviderOutcomeSignal = {
    statusCode?: number
    body?: string
    message?: string
}
