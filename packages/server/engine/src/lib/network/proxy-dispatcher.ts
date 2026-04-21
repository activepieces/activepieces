import { EnvHttpProxyAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici'
import type { UninstallFn } from './ssrf-guard'

export function installEnvProxyDispatcher(): UninstallFn {
    if (!hasProxyEnvConfigured()) {
        return () => undefined
    }
    const originalDispatcher = getGlobalDispatcher()
    setGlobalDispatcher(new EnvHttpProxyAgent())
    return () => setGlobalDispatcher(originalDispatcher)
}

function hasProxyEnvConfigured(): boolean {
    return PROXY_ENV_KEYS.some((key) => Boolean(process.env[key]))
}

const PROXY_ENV_KEYS = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'] as const
