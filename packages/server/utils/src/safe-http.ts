import http from 'node:http'
import https from 'node:https'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent'

function parseAllowListFromEnv(): string[] {
    const raw = process.env['AP_SSRF_ALLOW_LIST']
    if (!raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

function buildAgents({ allowList }: BuildAgentsParams): SsrfAgents {
    const filteringOptions = {
        keepAlive: true,
        allowPrivateIPAddress: false,
        allowLoopbackIPAddress: false,
        allowMetaIPAddress: false,
        allowIPAddressList: allowList,
    }
    return {
        httpAgent: new RequestFilteringHttpAgent(filteringOptions),
        httpsAgent: new RequestFilteringHttpsAgent(filteringOptions),
    }
}

function createAxios(config?: AxiosRequestConfig): AxiosInstance {
    const { httpAgent, httpsAgent } = buildAgents({ allowList: parseAllowListFromEnv() })
    return axios.create({
        ...config,
        httpAgent,
        httpsAgent,
    })
}

let lazyDefaultAxios: AxiosInstance | undefined

export const safeHttp = {
    buildAgents,
    createAxios,
    get axios(): AxiosInstance {
        lazyDefaultAxios ??= createAxios()
        return lazyDefaultAxios
    },
}

export type SsrfAgents = {
    httpAgent: http.Agent
    httpsAgent: https.Agent
}

type BuildAgentsParams = {
    allowList: string[]
}
