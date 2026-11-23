import fetchRetry from 'fetch-retry'

export function retryFetch(input: string | URL, init?: RequestInit): Promise<Response> {
    return fetchRetry(global.fetch, RETRY_OPTIONS)(input, init)
}

function backoffDelay(attempt: number): number {
    return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
}

const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 10000

const RETRY_OPTIONS = {
    retries: 7,
    retryDelay: backoffDelay,
    retryOn: [408, 429, 500, 502, 503, 504],
}
