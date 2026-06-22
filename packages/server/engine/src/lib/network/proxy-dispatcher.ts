import { EngineGenericError } from '@activepieces/shared'
import { EGRESS_PROXY_URL_ENV } from './global-agent-proxy'
import type { UninstallFn } from './ssrf-guard'

// Injected by esbuild `define`. The proxy bundle sets it true (undici included);
// the no-proxy bundle sets it false, so esbuild drops the `if` block — and with it
// the ~291KB undici dispatcher — leaving only the fail-closed throw below.
declare const __AP_PROXY_DISPATCHER__: boolean

export function installEnvProxyDispatcher(): UninstallFn {
    const proxyUrl = process.env[EGRESS_PROXY_URL_ENV]
    if (!proxyUrl) return () => undefined
    if (__AP_PROXY_DISPATCHER__) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ProxyAgent = require('undici/lib/dispatcher/proxy-agent.js') as typeof import('undici').ProxyAgent
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { setGlobalDispatcher, getGlobalDispatcher } = require('undici/lib/global.js') as Pick<typeof import('undici'), 'setGlobalDispatcher' | 'getGlobalDispatcher'>
        const originalDispatcher = getGlobalDispatcher()
        setGlobalDispatcher(new ProxyAgent(proxyUrl))
        return () => setGlobalDispatcher(originalDispatcher)
    }
    // Reached only if the no-proxy engine bundle was selected while STRICT mode set
    // AP_EGRESS_PROXY_URL. Fail closed — never let fetch() run unproxied past the SSRF boundary.
    throw new EngineGenericError('ProxyDispatcherMissing', 'Engine built without the proxy dispatcher, but AP_EGRESS_PROXY_URL is set. Wrong engine bundle for STRICT network mode — refusing to run unproxied.')
}
