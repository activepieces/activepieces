import http from 'node:http'
import https from 'node:https'
import { Readable } from 'node:stream'
import { isNil } from '@activepieces/shared'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent'

function parseAllowListFromEnv(): string[] {
    const raw = process.env['AP_SSRF_ALLOW_LIST']
    if (!raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

function buildAgents({ allowList, httpsAgentOptions }: BuildAgentsParams): SsrfAgents {
    const filteringOptions = {
        keepAlive: true,
        allowPrivateIPAddress: false,
        allowLoopbackIPAddress: false,
        allowMetaIPAddress: false,
        allowIPAddressList: allowList,
    }
    return {
        httpAgent: new RequestFilteringHttpAgent(filteringOptions),
        httpsAgent: new RequestFilteringHttpsAgent({ ...filteringOptions, ...httpsAgentOptions }),
    }
}

function isSsrfFilterError(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    const message = typeof error.message === 'string' ? error.message : ''
    const cause = error.cause instanceof Error ? error.cause.message : ''
    return SSRF_FILTER_MESSAGE_REGEX.test(message) || SSRF_FILTER_MESSAGE_REGEX.test(cause)
}

function attachSsrfErrorInterceptor(instance: AxiosInstance): AxiosInstance {
    instance.interceptors.response.use(undefined, (error: unknown) => {
        if (isSsrfFilterError(error)) {
            const original = error instanceof Error ? error.message : String(error)
            const enriched = `${original} — ${SSRF_REMEDIATION_HINT}`
            if (error instanceof Error) error.message = enriched
        }
        return Promise.reject(error)
    })
    return instance
}

function createAxios(config?: AxiosRequestConfig, { httpsAgentOptions }: SafeAxiosOptions = {}): AxiosInstance {
    const { httpAgent, httpsAgent } = buildAgents({
        allowList: parseAllowListFromEnv(),
        httpsAgentOptions,
    })
    return attachSsrfErrorInterceptor(axios.create({
        ...config,
        httpAgent,
        httpsAgent,
    }))
}

function createRetryingAxios(config?: AxiosRequestConfig, options?: SafeAxiosOptions): AxiosInstance {
    const instance = createAxios(config, options)
    axiosRetry(instance, {
        retries: 3,
        retryDelay: () => 2000,
        retryCondition: (error: AxiosError) =>
            !isNil(error.response?.status) && error.response.status >= 500 && error.response.status < 600,
    })
    return instance
}

/**
 * An SSRF-filtered `fetch` for code that must hand a WHATWG-`fetch`-shaped function to a library
 * (e.g. the MCP SDK transports) rather than use axios. Node's global `fetch` (undici) ignores
 * `http.Agent`, so it can't reuse `request-filtering-agent`; this builds the request on `node:http`/
 * `node:https` with the filtering agents (which reject private/loopback/link-local/metadata IPs at
 * connect time, closing the DNS-to-connect TOCTOU window) and adapts the Node response to a WHATWG
 * `Response` with a streaming body (so streaming protocols like SSE keep working).
 */
function createSafeFetch({ httpsAgentOptions }: SafeAxiosOptions = {}): SafeFetch {
    const { httpAgent, httpsAgent } = buildAgents({ allowList: parseAllowListFromEnv(), httpsAgentOptions })
    return (url, init) => new Promise<Response>((resolve, reject) => {
        const target = url instanceof URL ? url : new URL(String(url))
        const isHttps = target.protocol === 'https:'
        const requestModule = isHttps ? https : http
        const request = requestModule.request(target, {
            method: init?.method ?? 'GET',
            headers: toOutgoingHeaders(init?.headers),
            agent: isHttps ? httpsAgent : httpAgent,
            ...(isNil(init?.signal) ? {} : { signal: init.signal }),
        }, (response) => {
            const hasBody = response.statusCode !== 204 && response.statusCode !== 304
            resolve(new Response(hasBody ? toWebBody(response) : null, {
                status: response.statusCode ?? 502,
                statusText: response.statusMessage,
                headers: toResponseHeaders(response.headers),
            }))
        })
        request.on('error', reject)
        writeRequestBody(request, init?.body)
    })
}

function toOutgoingHeaders(headers: RequestInit['headers']): Record<string, string> {
    const result: Record<string, string> = {}
    new Headers(headers ?? {}).forEach((value, key) => {
        result[key] = value
    })
    return result
}

function toResponseHeaders(headers: http.IncomingHttpHeaders): Headers {
    const result = new Headers()
    for (const [key, value] of Object.entries(headers)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                result.append(key, item)
            }
        }
        else if (!isNil(value)) {
            result.append(key, value)
        }
    }
    return result
}

function toWebBody(response: http.IncomingMessage): ReadableStream<Uint8Array> {
    return Readable.toWeb(response) as ReadableStream<Uint8Array>
}

function writeRequestBody(request: http.ClientRequest, body: RequestInit['body']): void {
    if (isNil(body)) {
        request.end()
        return
    }
    if (typeof body === 'string' || body instanceof Uint8Array) {
        request.end(body)
        return
    }
    request.end()
}

let lazyDefaultAxios: AxiosInstance | undefined
let lazyRetryingAxios: AxiosInstance | undefined

const SSRF_FILTER_MESSAGE_REGEX = /(DNS lookup .* not allowed|IP .* is not allowed)/i
const SSRF_REMEDIATION_HINT = 'the target is blocked by the SSRF filter. If it is a trusted internal host (e.g. a self-hosted Vault, Conjur, or OAuth2 provider), add its IP or CIDR to the AP_SSRF_ALLOW_LIST environment variable (comma-separated) and restart the server.'

export const safeHttp = {
    buildAgents,
    createAxios,
    createRetryingAxios,
    createSafeFetch,
    get axios(): AxiosInstance {
        lazyDefaultAxios ??= createAxios()
        return lazyDefaultAxios
    },
    get retryingAxios(): AxiosInstance {
        lazyRetryingAxios ??= createRetryingAxios()
        return lazyRetryingAxios
    },
}

export type SafeFetch = (url: string | URL, init?: RequestInit) => Promise<Response>

export type SsrfAgents = {
    httpAgent: http.Agent
    httpsAgent: https.Agent
}

export type SafeAxiosOptions = {
    httpsAgentOptions?: https.AgentOptions
}

type BuildAgentsParams = {
    allowList: string[]
    httpsAgentOptions?: https.AgentOptions
}
