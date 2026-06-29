export class ApSdkError extends Error {
    public readonly status: number
    public readonly body: unknown

    constructor({ message, status, body }: { message: string, status: number, body: unknown }) {
        super(message)
        this.name = 'ApSdkError'
        this.status = status
        this.body = body
    }
}

export function createHttpClient({ apiKey, instanceUrl }: { apiKey: string, instanceUrl: string }): HttpClient {
    const baseUrl = instanceUrl.replace(/\/+$/, '').replace(/\/api$/, '') + '/api'

    async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
        const url = new URL(baseUrl + path)
        for (const [key, value] of Object.entries(options.query ?? {})) {
            appendQueryParam(url, key, value)
        }

        const response = await fetch(url.toString(), {
            method,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
        })

        const rawText = await response.text()
        const parsed = rawText.length > 0 ? safeJsonParse(rawText) : undefined

        if (!response.ok) {
            throw new ApSdkError({
                message: `Activepieces SDK request failed: ${method} ${path} → ${response.status}`,
                status: response.status,
                body: parsed ?? rawText,
            })
        }

        if (typeof parsed === 'string') {
            throw new ApSdkError({
                message: `Activepieces SDK got a non-JSON ${response.status} response for ${method} ${path}. This usually means instanceUrl points at the web app rather than the API — check that ${baseUrl} reaches the Activepieces backend.`,
                status: response.status,
                body: parsed.slice(0, 200),
            })
        }

        return parsed as T
    }

    return {
        get: (path, options) => request('GET', path, options),
        post: (path, options) => request('POST', path, options),
        delete: (path, options) => request('DELETE', path, options),
    }
}

function appendQueryParam(url: URL, key: string, value: QueryValue): void {
    if (value === undefined || value === null) {
        return
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            url.searchParams.append(key, String(item))
        }
        return
    }
    url.searchParams.append(key, String(value))
}

function safeJsonParse(text: string): unknown {
    try {
        return JSON.parse(text)
    }
    catch {
        return text
    }
}

type QueryValue = string | number | boolean | string[] | undefined | null

type RequestOptions = {
    body?: unknown
    query?: Record<string, QueryValue>
}

export type HttpClient = {
    get: <T>(path: string, options?: RequestOptions) => Promise<T>
    post: <T>(path: string, options?: RequestOptions) => Promise<T>
    delete: <T>(path: string, options?: RequestOptions) => Promise<T>
}
