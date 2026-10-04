import { isNil, tryCatchSync } from '@activepieces/core-utils'
import { FastifyRequest } from 'fastify'
import { networkUtils } from './network-utils'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

export const domainHelper = {
    async getPublicUrl({ path }: PublicUrlParams): Promise<string> {
        return networkUtils.combineUrl(system.getOrThrow(AppSystemProp.FRONTEND_URL), path ?? '')
    },
    getBrowserLandingUrl({ path }: PublicUrlParams): string {
        const { origin } = new URL(system.getOrThrow(AppSystemProp.FRONTEND_URL))
        return networkUtils.cleanTrailingSlash(networkUtils.combineUrl(origin, path ?? ''))
    },
    getConfiguredPublicUrl(): string {
        return networkUtils.cleanTrailingSlash(system.getOrThrow(AppSystemProp.FRONTEND_URL))
    },
    getPublicUrlFromRequest({ req, path }: PublicUrlFromRequestParams): string {
        const matchedHost = matchConfiguredHost(req)
        const baseUrl = matchedHost?.kind === 'mcp'
            ? matchedHost.baseUrl
            : networkUtils.combineUrl(networkUtils.getRequestBaseUrl(req), getConfiguredBasePath())
        return networkUtils.cleanTrailingSlash(networkUtils.combineUrl(baseUrl, path ?? ''))
    },
    isMcpHostRequest({ req }: RequestParams): boolean {
        return matchConfiguredHost(req)?.kind === 'mcp'
    },
    isUnconfiguredHostRequest({ req }: RequestParams): boolean {
        return isNil(matchConfiguredHost(req))
    },
    hasMcpUrl(): boolean {
        return !isNil(system.get(AppSystemProp.MCP_URL))
    },
    getMcpUrl({ path }: PublicUrlParams): string {
        const mcpUrl = system.get(AppSystemProp.MCP_URL) ?? system.getOrThrow(AppSystemProp.FRONTEND_URL)
        return networkUtils.cleanTrailingSlash(networkUtils.combineUrl(mcpUrl, path ?? ''))
    },
    async getPublicApiUrl({ path }: PublicUrlParams): Promise<string> {
        return domainHelper.getPublicUrl({ path: `/api/${networkUtils.cleanLeadingSlash(path ?? '')}` })
    },
    async getInternalUrl({ path }: InternalUrlParams): Promise<string> {
        const internalUrl = system.get(AppSystemProp.INTERNAL_URL)
        if (internalUrl) {
            return networkUtils.combineUrl(internalUrl, path ?? '')
        }
        return this.getPublicUrl({ path })
    },
    async getInternalApiUrl({ path }: InternalUrlParams): Promise<string> {
        return this.getInternalUrl({ path: `/api/${networkUtils.cleanLeadingSlash(path ?? '')}` })
    },
    async getApiUrlForWorker({ path }: PublicUrlParams): Promise<string> {
        const hasWorkerModule = system.isWorker()
        if (hasWorkerModule) {
            const port = system.get(AppSystemProp.PORT)
            return networkUtils.combineUrl(`http://127.0.0.1:${port}/api`, path ?? '')
        }
        return this.getInternalApiUrl({ path: path ?? '' })
    },
}

function getConfiguredBasePath(): string {
    const { data: url } = tryCatchSync(() => new URL(system.getOrThrow(AppSystemProp.FRONTEND_URL)))
    return url && url.pathname !== '/' ? url.pathname : ''
}

function getConfiguredHosts(): ConfiguredHost[] {
    const { data: frontendUrl } = tryCatchSync(() => system.getOrThrow(AppSystemProp.FRONTEND_URL))
    const candidates: { kind: ConfiguredHostKind, baseUrl: string | null | undefined }[] = [
        { kind: 'mcp', baseUrl: system.get(AppSystemProp.MCP_URL) },
        { kind: 'frontend', baseUrl: frontendUrl },
    ]
    return candidates.flatMap(({ kind, baseUrl }) => {
        if (isNil(baseUrl)) {
            return []
        }
        const parsed = tryCatchSync(() => new URL(baseUrl))
        return parsed.error ? [] : [{
            kind,
            host: parsed.data.host.toLowerCase(),
            baseUrl: networkUtils.cleanTrailingSlash(baseUrl),
        }]
    })
}

function matchConfiguredHost(req: FastifyRequest): ConfiguredHost | null {
    const requestHost = networkUtils.getRequestHost(req).toLowerCase()
    return getConfiguredHosts().find((entry) => entry.host === requestHost) ?? null
}

type ConfiguredHostKind = 'mcp' | 'frontend'

type ConfiguredHost = {
    kind: ConfiguredHostKind
    host: string
    baseUrl: string
}

type PublicUrlParams = {
    path?: string
}

type RequestParams = {
    req: FastifyRequest
}

type PublicUrlFromRequestParams = {
    req: FastifyRequest
    path?: string
}

type InternalUrlParams = {
    path: string
}
