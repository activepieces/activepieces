import http from 'node:http'
import https from 'node:https'
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

export function buildSsrfSafeAxiosAgents(): SsrfAgents {
    return buildAgents({
        allowList: system.getList(AppSystemProp.SSRF_ALLOW_LIST),
    })
}

export function buildAgents({ allowList }: BuildAgentsParams): SsrfAgents {
    const filteringOptions = {
        keepAlive: true,
        allowPrivateIPAddress: false,
        allowMetaIPAddress: false,
        allowIPAddressList: allowList,
    }
    return {
        httpAgent: new RequestFilteringHttpAgent(filteringOptions),
        httpsAgent: new RequestFilteringHttpsAgent(filteringOptions),
    }
}

export type SsrfAgents = {
    httpAgent: http.Agent
    httpsAgent: https.Agent
}

type BuildAgentsParams = {
    allowList: string[]
}
