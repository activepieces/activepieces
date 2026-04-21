import http from 'node:http'
import https from 'node:https'
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

function createAxios(config?: AxiosRequestConfig, { httpsAgentOptions }: SafeAxiosOptions = {}): AxiosInstance {
    const { httpAgent, httpsAgent } = buildAgents({
        allowList: parseAllowListFromEnv(),
        httpsAgentOptions,
    })
    return axios.create({
        ...config,
        httpAgent,
        httpsAgent,
    })
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

let lazyDefaultAxios: AxiosInstance | undefined
let lazyRetryingAxios: AxiosInstance | undefined

export const safeHttp = {
    buildAgents,
    createAxios,
    createRetryingAxios,
    get axios(): AxiosInstance {
        lazyDefaultAxios ??= createAxios()
        return lazyDefaultAxios
    },
    get retryingAxios(): AxiosInstance {
        lazyRetryingAxios ??= createRetryingAxios()
        return lazyRetryingAxios
    },
}

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
