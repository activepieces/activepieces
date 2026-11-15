import fetchRetry from 'fetch-retry'

export function retryFetch(input: string | URL, init?: RequestInit): Promise<Response> {
    return fetchRetry(global.fetch, RETRY_OPTIONS)(input, init)
}

const RETRY_OPTIONS = {
    retries: 3,
    retryDelay: 3000,
    retryOn: [408, 429, 500, 502, 503, 504],
}
