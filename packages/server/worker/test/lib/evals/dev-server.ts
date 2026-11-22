import { isNil } from '@activepieces/core-utils'

function url(): string {
    return (process.env[BASE_URL_ENV] ?? DEFAULT_BASE_URL).replace(/\/$/, '')
}

function apiKey(): string {
    const value = process.env[API_KEY_ENV]
    if (isNil(value) || value.length === 0) {
        throw new Error(`${API_KEY_ENV} is not set. It must match the running dev server's AP_API_KEY.`)
    }
    return value
}

async function request({ path, method, body }: { path: string, method: 'GET' | 'POST' | 'DELETE', body?: unknown }): Promise<Response> {
    return fetch(`${url()}${path}`, {
        method,
        headers: { 'api-key': apiKey(), ...(isNil(body) ? {} : { 'Content-Type': 'application/json' }) },
        ...(isNil(body) ? {} : { body: JSON.stringify(body) }),
    })
}

const API_KEY_ENV = 'AP_API_KEY'
const BASE_URL_ENV = 'AP_EVAL_BASE_URL'
const DEFAULT_BASE_URL = 'http://localhost:3000/api'

export const devServer = {
    url,
    apiKey,
    request,
    apiKeyEnv: API_KEY_ENV,
    baseUrlEnv: BASE_URL_ENV,
}
