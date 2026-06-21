import { EGRESS_PROXY_URL_ENV } from './global-agent-proxy'
import type { UninstallFn } from './ssrf-guard'

export function installEnvProxyDispatcher(): UninstallFn {
    const proxyUrl = process.env[EGRESS_PROXY_URL_ENV]
    if (!proxyUrl) return () => undefined
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ProxyAgent = require('undici/lib/dispatcher/proxy-agent.js') as typeof import('undici').ProxyAgent
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { setGlobalDispatcher, getGlobalDispatcher } = require('undici/lib/global.js') as Pick<typeof import('undici'), 'setGlobalDispatcher' | 'getGlobalDispatcher'>
    const originalDispatcher = getGlobalDispatcher()
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
    return () => setGlobalDispatcher(originalDispatcher)
}
