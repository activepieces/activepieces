import { HttpClient } from '@crowdin/crowdin-api-client'
import { FetchClientJsonPayloadError } from '@crowdin/crowdin-api-client/out/core/internal/fetch/fetchClientError'

function create({ sendRequest = fetch, waitBeforeRetry = wait }: CreateCrowdinHttpClientParams): HttpClient {
    async function sendWithRetries<T>({ method, url, headers, body }: CrowdinRequest): Promise<T> {
        const resource = resourceOf({ url })
        for (let attempt = 0; ; attempt++) {
            const response = await sendRequest(url, {
                method,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: body === undefined ? undefined : JSON.stringify(body),
            }).catch((error: unknown) => {
                if (method === 'POST' || attempt >= MAX_RETRIES) {
                    throw error
                }
                return null
            })
            if (response === null) {
                await waitBeforeRetry(RETRY_DELAY_MS * (attempt + 1))
                continue
            }
            const shouldRetry = BUSY_STATUSES.includes(response.status) || (method !== 'POST' && SERVER_ERROR_STATUSES.includes(response.status))
            if (shouldRetry && attempt < MAX_RETRIES) {
                await waitBeforeRetry(RETRY_DELAY_MS * (attempt + 1))
                continue
            }
            const responseText = await response.text()
            if (!response.ok) {
                const detail = errorDetailOf({ responseText })
                throw new FetchClientJsonPayloadError(`${method} ${resource} -> HTTP ${response.status}${detail.length > 0 ? `: ${detail}` : ''}`, null, response.status)
            }
            const parsedBody: T = responseText.length > 0 ? JSON.parse(responseText) : {}
            return parsedBody
        }
    }

    return {
        get: <T>(url: string, config?: RequestConfig) => sendWithRetries<T>({ method: 'GET', url, headers: config?.headers }),
        head: <T>(url: string, config?: RequestConfig) => sendWithRetries<T>({ method: 'HEAD', url, headers: config?.headers }),
        delete: <T>(url: string, config?: RequestConfig) => sendWithRetries<T>({ method: 'DELETE', url, headers: config?.headers }),
        post: <T>(url: string, body?: unknown, config?: RequestConfig) => sendWithRetries<T>({ method: 'POST', url, headers: config?.headers, body }),
        put: <T>(url: string, body?: unknown, config?: RequestConfig) => sendWithRetries<T>({ method: 'PUT', url, headers: config?.headers, body }),
        patch: <T>(url: string, body?: unknown, config?: RequestConfig) => sendWithRetries<T>({ method: 'PATCH', url, headers: config?.headers, body }),
    }
}

function resourceOf({ url }: { url: string }): string {
    const { pathname, search } = new URL(url)
    return `${pathname.replace(API_PATH_PREFIX, '')}${search}`
}

function errorDetailOf({ responseText }: { responseText: string }): string {
    try {
        const errorBody: CrowdinErrorBody = JSON.parse(responseText)
        const message = errorBody.error?.message ?? errorBody.errors?.[0]?.error?.errors?.[0]?.message ?? responseText
        return message.slice(0, MAX_DETAIL_LENGTH)
    }
    catch {
        return responseText.slice(0, MAX_DETAIL_LENGTH)
    }
}

function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const API_PATH_PREFIX = /^\/api\/v2/
const BUSY_STATUSES = [409, 429]
const SERVER_ERROR_STATUSES = [500, 502, 503, 504]
const MAX_RETRIES = 5
const RETRY_DELAY_MS = 2000
const MAX_DETAIL_LENGTH = 300

export const crowdinHttpClient = { create }

export type SendRequest = (url: string, init: RequestInit) => Promise<Response>

export type WaitBeforeRetry = (milliseconds: number) => Promise<void>

type CreateCrowdinHttpClientParams = {
    sendRequest?: SendRequest
    waitBeforeRetry?: WaitBeforeRetry
}

type RequestConfig = {
    headers: Record<string, string>
}

type CrowdinRequest = {
    method: 'GET' | 'HEAD' | 'DELETE' | 'POST' | 'PUT' | 'PATCH'
    url: string
    headers?: Record<string, string>
    body?: unknown
}

type CrowdinErrorBody = {
    error?: { message?: string }
    errors?: { error?: { errors?: { message?: string }[] } }[]
}
