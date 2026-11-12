function create({ token, projectId, readOnly = false, fetchImpl = fetch, sleep = wait }: CreateParams): CrowdinClient {
    const base = `${API}/projects/${projectId}`

    async function request<T>({ method, path, body }: RequestParams): Promise<T> {
        if (readOnly && method !== 'GET') {
            throw new Error(`Crowdin client is read-only, refusing ${method} ${path}`)
        }
        for (let attempt = 0; ; attempt++) {
            const response = await fetchImpl(`${base}${path}`, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: body === undefined ? undefined : JSON.stringify(body),
            })
            const retryable = BUSY_STATUSES.includes(response.status) || (method !== 'POST' && SERVER_ERROR_STATUSES.includes(response.status))
            if (retryable && attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS * (attempt + 1))
                continue
            }
            const text = await response.text()
            if (!response.ok) {
                throw new CrowdinError({ method, path, status: response.status, detail: errorDetail({ text }) })
            }
            const parsed: T = text.length > 0 ? JSON.parse(text) : {}
            return parsed
        }
    }

    async function list<T>({ path }: { path: string }): Promise<T[]> {
        const separator = path.includes('?') ? '&' : '?'
        const rows: T[] = []
        for (let offset = 0; ; offset += PAGE_SIZE) {
            const page = await request<{ data: { data: T }[] }>({ method: 'GET', path: `${path}${separator}limit=${PAGE_SIZE}&offset=${offset}` })
            rows.push(...page.data.map(({ data }) => data))
            if (page.data.length < PAGE_SIZE) {
                return rows
            }
        }
    }

    return {
        get: <T>({ path }: { path: string }) => request<T>({ method: 'GET', path }),
        list,
        patch: ({ path, body }: { path: string, body: unknown }) => request<unknown>({ method: 'PATCH', path, body }),
        post: <T>({ path, body }: { path: string, body: unknown }) => request<T>({ method: 'POST', path, body }),
        del: ({ path }: { path: string }) => request<unknown>({ method: 'DELETE', path }),
    }
}

function errorDetail({ text }: { text: string }): string {
    try {
        const parsed: CrowdinErrorBody = JSON.parse(text)
        const message = parsed.error?.message ?? parsed.errors?.[0]?.error?.errors?.[0]?.message ?? text
        return message.slice(0, MAX_DETAIL_LENGTH)
    }
    catch {
        return text.slice(0, MAX_DETAIL_LENGTH)
    }
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const API = 'https://api.crowdin.com/api/v2'
const BUSY_STATUSES = [409, 429]
const SERVER_ERROR_STATUSES = [500, 502, 503, 504]
const MAX_RETRIES = 5
const RETRY_DELAY_MS = 2000
const PAGE_SIZE = 500
const MAX_DETAIL_LENGTH = 300

export class CrowdinError extends Error {
    status: number

    constructor({ method, path, status, detail }: CrowdinErrorParams) {
        super(`${method} ${path} -> HTTP ${status}${detail.length > 0 ? `: ${detail}` : ''}`)
        this.status = status
    }
}

export const crowdinClient = { create }

export type CrowdinClient = {
    get: <T>(params: { path: string }) => Promise<T>
    list: <T>(params: { path: string }) => Promise<T[]>
    patch: (params: { path: string, body: unknown }) => Promise<unknown>
    post: <T>(params: { path: string, body: unknown }) => Promise<T>
    del: (params: { path: string }) => Promise<unknown>
}

type CreateParams = {
    token: string
    projectId: string
    readOnly?: boolean
    fetchImpl?: (url: string, init: RequestInit) => Promise<Response>
    sleep?: (ms: number) => Promise<void>
}

type RequestParams = {
    method: 'GET' | 'PATCH' | 'POST' | 'DELETE'
    path: string
    body?: unknown
}

type CrowdinErrorParams = {
    method: string
    path: string
    status: number
    detail: string
}

type CrowdinErrorBody = {
    error?: { message?: string }
    errors?: { error?: { errors?: { message?: string }[] } }[]
}
