import { setTimeout as sleep } from 'node:timers/promises'

export const cloudApiFetch = { fetchWithRetry }

async function fetchWithRetry({ url, init = {}, maxAttempts = MAX_ATTEMPTS, baseDelayMs = BASE_DELAY_MS, timeoutMs = REQUEST_TIMEOUT_MS }: FetchWithRetryParams): Promise<Response> {
    const method = init.method ?? 'GET'
    let lastFailure = 'no attempt made'
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const outcome = await attemptFetch({ url, init, timeoutMs })
        if (outcome.response !== null && !isRetryableStatus(outcome.response.status)) {
            return outcome.response
        }
        lastFailure = outcome.response !== null ? `status=${outcome.response.status}` : describeError(outcome.error)
        console.warn(`[cloudApiFetch] ${method} ${url} attempt=${attempt}/${maxAttempts} failed: ${lastFailure}`)
        if (attempt < maxAttempts) {
            await sleep(retryDelayMs({ attempt, baseDelayMs }))
        }
    }
    throw new Error(`[cloudApiFetch] ${method} ${url} failed after ${maxAttempts} attempts: ${lastFailure}`)
}

function attemptFetch({ url, init, timeoutMs }: { url: string, init: RequestInit, timeoutMs: number }): Promise<AttemptOutcome> {
    return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
        .then(bufferResponse)
        .then(
            (response): AttemptOutcome => ({ response, error: null }),
            (error: unknown): AttemptOutcome => ({ response: null, error: error instanceof Error ? error : new Error(String(error)) }),
        )
}

async function bufferResponse(response: Response): Promise<Response> {
    const body = await response.arrayBuffer()
    return new Response(body.byteLength === 0 ? null : body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })
}

function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500
}

function retryDelayMs({ attempt, baseDelayMs }: { attempt: number, baseDelayMs: number }): number {
    const jitterMs = Math.floor(Math.random() * baseDelayMs / 2)
    return Math.min(baseDelayMs * 2 ** (attempt - 1), MAX_DELAY_MS) + jitterMs
}

function describeError(error: Error): string {
    const cause = error.cause instanceof Error ? ` (cause: ${error.cause.message})` : ''
    return `${error.name}: ${error.message}${cause}`
}

const MAX_ATTEMPTS = 5
const BASE_DELAY_MS = 2000
const MAX_DELAY_MS = 30000
const REQUEST_TIMEOUT_MS = 60000

type FetchWithRetryParams = {
    url: string
    init?: RequestInit
    maxAttempts?: number
    baseDelayMs?: number
    timeoutMs?: number
}

type AttemptOutcome = { response: Response, error: null } | { response: null, error: Error }
