import http from 'node:http'
import https from 'node:https'
import { finished, Readable } from 'node:stream'
import { isNil, tryCatch } from '@activepieces/core-utils';
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

async function postForStatus({ url, headers, body, timeoutMs }: PostForStatusParams): Promise<PostForStatusResult> {
    const signal = AbortSignal.timeout(timeoutMs)
    const { data: response, error } = await tryCatch(() => safeHttp.axios.request<Readable>({
        url,
        method: 'POST',
        headers,
        data: body,
        signal,
        responseType: 'stream',
        decompress: false,
        validateStatus: () => true,
    }))
    if (error !== null) {
        return { responded: false, failure: toPostFailure({ error, signal }), error }
    }
    await discardResponseBody({ body: response.data, signal })
    return { responded: true, status: response.status }
}

function discardResponseBody({ body, signal }: DiscardResponseBodyParams): Promise<void> {
    return new Promise((resolve) => {
        const stop = (): void => {
            body.destroy()
        }
        let receivedBytes = 0
        body.on('data', (chunk: Buffer) => {
            receivedBytes += chunk.length
            if (receivedBytes > MAX_DRAINED_RESPONSE_BYTES) {
                stop()
            }
        })
        finished(body, () => {
            signal.removeEventListener('abort', stop)
            resolve()
        })
        if (signal.aborted) {
            stop()
            return
        }
        signal.addEventListener('abort', stop, { once: true })
    })
}

function toPostFailure({ error, signal }: ToPostFailureParams): PostForStatusFailure {
    const code = errorCodeOf(error)
    if (signal.aborted || TIMEOUT_ERROR_CODES.includes(code)) {
        return PostForStatusFailure.TIMEOUT
    }
    if (isSsrfFilterError(error)) {
        return PostForStatusFailure.BLOCKED
    }
    if (TLS_ERROR_CODE_REGEX.test(code)) {
        return PostForStatusFailure.TLS
    }
    return PostForStatusFailure.CONNECTION_FAILED
}

function errorCodeOf(error: Error): string {
    if ('code' in error && typeof error.code === 'string') {
        return error.code
    }
    return error.cause instanceof Error ? errorCodeOf(error.cause) : ''
}

let lazyDefaultAxios: AxiosInstance | undefined
let lazyRetryingAxios: AxiosInstance | undefined

const SSRF_FILTER_MESSAGE_REGEX = /(DNS lookup .* not allowed|IP .* is not allowed)/i
const SSRF_REMEDIATION_HINT = 'the target is blocked by the SSRF filter. If it is a trusted internal host (e.g. a self-hosted Vault, Conjur, or OAuth2 provider), add its IP or CIDR to the AP_SSRF_ALLOW_LIST environment variable (comma-separated) and restart the server.'
const MAX_DRAINED_RESPONSE_BYTES = 16 * 1024
const TIMEOUT_ERROR_CODES = ['ETIMEDOUT', 'ECONNABORTED']
const TLS_ERROR_CODE_REGEX = /^(ERR_TLS_|ERR_SSL_|CERT_|UNABLE_TO_|DEPTH_ZERO_SELF_SIGNED_CERT$|SELF_SIGNED_CERT_IN_CHAIN$|EPROTO$)/

export const safeHttp = {
    buildAgents,
    createAxios,
    createRetryingAxios,
    postForStatus,
    get axios(): AxiosInstance {
        lazyDefaultAxios ??= createAxios()
        return lazyDefaultAxios
    },
    get retryingAxios(): AxiosInstance {
        lazyRetryingAxios ??= createRetryingAxios()
        return lazyRetryingAxios
    },
}

export enum PostForStatusFailure {
    BLOCKED = 'BLOCKED',
    TIMEOUT = 'TIMEOUT',
    TLS = 'TLS',
    CONNECTION_FAILED = 'CONNECTION_FAILED',
}

export type PostForStatusResult =
    | { responded: true, status: number }
    | { responded: false, failure: PostForStatusFailure, error: Error }

export type SsrfAgents = {
    httpAgent: http.Agent
    httpsAgent: https.Agent
}

type PostForStatusParams = {
    url: string
    headers: Record<string, string>
    body: unknown
    timeoutMs: number
}

type DiscardResponseBodyParams = {
    body: Readable
    signal: AbortSignal
}

type ToPostFailureParams = {
    error: Error
    signal: AbortSignal
}

export type SafeAxiosOptions = {
    httpsAgentOptions?: https.AgentOptions
}

type BuildAgentsParams = {
    allowList: string[]
    httpsAgentOptions?: https.AgentOptions
}
