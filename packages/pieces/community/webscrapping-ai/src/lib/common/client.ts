import { AuthenticationType, HttpMethod, HttpRequest, HttpResponse, HttpMessageBody, httpClient } from '@activepieces/pieces-common';

export type WebScrapingAiAuth = {
    apiKey: string
}

type RetryConfig = {
    maxRetries: number
    initialDelayMs: number
}

const DEFAULT_RETRY: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 500,
}

const BASE_URL = 'https://api.webscraping.ai';

export async function wsaiRequest<T extends HttpMessageBody>({
    method,
    path,
    auth,
    queryParams,
    body,
    headers,
    retry = DEFAULT_RETRY,
}: {
    method: HttpMethod
    path: string
    auth: WebScrapingAiAuth
    queryParams?: Record<string, string>
    body?: unknown
    headers?: Record<string, string>
    retry?: RetryConfig
}): Promise<T> {
    let attempt = 0
    let delay = retry.initialDelayMs

    while (true) {
        try {
            const finalQueryParams: Record<string, string> = {
                ...(queryParams ?? {}),
                api_key: auth.apiKey,
            }
            const request: HttpRequest = {
                method,
                url: `${BASE_URL}${path}`,
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    ...headers,
                },
                queryParams: finalQueryParams,
                body,
                timeout: 60000,
            }
            const resp: HttpResponse<T> = await httpClient.sendRequest<T>(request)
            return resp.body
        }
        catch (e: any) {
            const status: number | undefined = e?.response?.status
            const retriable = status === 429 || (status !== undefined && status >= 500)
            if (retriable && attempt < retry.maxRetries) {
                await new Promise(res => setTimeout(res, delay))
                attempt += 1
                delay *= 2
                continue
            }
            const message = e?.response?.body?.message || e?.message || 'Request failed'
            throw new Error(`WebScraping.AI request failed${status ? ` (HTTP ${status})` : ''}: ${message}`)
        }
    }
}

export const wsaiPaths = {
    html: '/html',
    text: '/text',
    question: '/ai/question',
    fields: '/ai/fields',
    account: '/account',
}


