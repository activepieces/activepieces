import http from 'node:http'
import https from 'node:https'
import { tryCatchSync } from '@activepieces/shared'
import { HttpProxyAgent } from 'http-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import type { UninstallFn } from './ssrf-guard'

export function installGlobalProxyAgents(): UninstallFn {
    const proxyUrl = readProxyUrl()
    if (!proxyUrl) return () => undefined

    const originalHttp = http.globalAgent
    const originalHttps = https.globalAgent
    http.globalAgent = new HttpProxyAgent(proxyUrl)
    https.globalAgent = new HttpsProxyAgent(proxyUrl)
    return () => {
        http.globalAgent = originalHttp
        https.globalAgent = originalHttps
    }
}

function readProxyUrl(): string | null {
    const raw = process.env[EGRESS_PROXY_URL_ENV]
    if (!raw) return null
    const { data: url } = tryCatchSync(() => new URL(raw))
    return url ? raw : null
}

export const EGRESS_PROXY_URL_ENV = 'AP_EGRESS_PROXY_URL'
