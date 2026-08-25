import { z } from 'zod'
import { formatPieceError } from './friendly-piece-error'

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

export function observedProviderFetch(onOutcome: ProviderOutcomeReporter | undefined): typeof globalThis.fetch | undefined {
    if (isNil(onOutcome)) {
        return undefined
    }
    return async (input, init) => {
        let response: Response
        try {
            response = await fetch(input, init)
        }
        catch (error) {
            report({ observed: Promise.resolve(toProviderOutcomeSignal(error)), onOutcome })
            throw error
        }
        report({ observed: observeResponse(response), onOutcome })
        return response
    }
}

function report({ observed, onOutcome }: { observed: Promise<ProviderOutcomeSignal>, onOutcome: ProviderOutcomeReporter }): void {
    void observed.then(onOutcome).catch(() => undefined)
}

async function observeResponse(response: Response): Promise<ProviderOutcomeSignal> {
    if (response.ok) {
        return { statusCode: response.status }
    }
    const body = await readEnoughToClassify(response)
    return { statusCode: response.status, ...(isNil(body) ? {} : { body }) }
}

async function readEnoughToClassify(response: Response): Promise<string | undefined> {
    try {
        const stream = response.clone().body
        if (isNil(stream)) {
            return undefined
        }
        const reader = stream.getReader()
        const decoder = new TextDecoder()
        let text = ''
        try {
            while (text.length < MAX_OBSERVED_BODY_LENGTH) {
                const { done, value } = await reader.read()
                if (done) {
                    break
                }
                text += decoder.decode(value, { stream: true })
            }
        }
        finally {
            void reader.cancel().catch(() => undefined)
        }
        return text.slice(0, MAX_OBSERVED_BODY_LENGTH)
    }
    catch {
        return undefined
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
    if (statusCode === 429 && RATE_LIMIT_BODY_PATTERN.test(haystack)) {
        return 'no_change'
    }
    if (BILLING_BODY_PATTERN.test(haystack)) {
        return 'out_of_credits'
    }
    if (statusCode === 429) {
        return 'no_change'
    }
    if (statusCode === 404) {
        return MODEL_NOT_FOUND_PATTERN.test(haystack) ? 'no_change' : 'unreachable'
    }
    if (statusCode === 408 || statusCode >= 500) {
        return 'unreachable'
    }
    return 'no_change'
}

function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined
}

const MAX_OBSERVED_BODY_LENGTH = 2000
const CREDIT_ERROR_PATTERNS = [/credits/i, /\b402\b/, /payment.required/i]

const TRANSIENT_ERROR_PATTERN = /\b(429|5\d\d)\b|rate.?limit|timeout|timed out|temporarily|try again|econnreset|etimedout|socket hang up|service unavailable/i

const BILLING_BODY_PATTERN = /insufficient_quota|credit[_ ]balance|billing_hard_limit_reached|billing|\bcredits?\b|out of funds|payment required/i

const RATE_LIMIT_BODY_PATTERN = /per minute|per day|per_minute|per_day|requests? per|tokens? per|rate.?limit|resource_exhausted|\brpm\b|\btpm\b/i

const MODEL_NOT_FOUND_PATTERN = /model|deployment|engine/i

export const AiProviderKeyStatus = z.enum(['active', 'out_of_credits', 'rejected', 'unreachable'])
export type AiProviderKeyStatus = z.infer<typeof AiProviderKeyStatus>

export type NoStatusChange = 'no_change'

export type ProviderOutcomeSignal = {
    statusCode?: number
    body?: string
    message?: string
}

export type ProviderOutcomeReporter = (signal: ProviderOutcomeSignal) => void | Promise<void>
