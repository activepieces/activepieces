import { getGlobalDispatcher, ProxyAgent, setGlobalDispatcher } from 'undici'
import { EGRESS_PROXY_URL_ENV } from './global-agent-proxy'
import type { UninstallFn } from './ssrf-guard'

export function installEnvProxyDispatcher(): UninstallFn {
    const proxyUrl = process.env[EGRESS_PROXY_URL_ENV]
    if (!proxyUrl) return () => undefined
    const originalDispatcher = getGlobalDispatcher()
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
    return () => setGlobalDispatcher(originalDispatcher)
}
