import { isNil, tryCatchSync } from '@activepieces/core-utils'
import { FastifyRequest } from 'fastify'
import { networkUtils } from './network-utils'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

export const domainHelper = {
    async getPublicUrl({ path }: PublicUrlParams): Promise<string> {
        return networkUtils.combineUrl(system.getOrThrow(AppSystemProp.FRONTEND_URL), path ?? '')
    },
    async getBrowserLandingUrl({ path }: PublicUrlParams): Promise<string> {
        const { origin } = new URL(system.getOrThrow(AppSystemProp.FRONTEND_URL))
        return networkUtils.cleanTrailingSlash(networkUtils.combineUrl(origin, path ?? ''))
    },
    getPublicUrlFromRequest({ req, path }: PublicUrlFromRequestParams): string {
        const matchedBaseUrl = findConfiguredBaseUrl(req)
        const baseWithPrefix = matchedBaseUrl ?? networkUtils.combineUrl(networkUtils.getRequestBaseUrl(req), getConfiguredBasePath())
        return networkUtils.cleanTrailingSlash(networkUtils.combineUrl(baseWithPrefix, path ?? ''))
    },
    isMcpHostRequest({ req }: PublicUrlFromRequestParams): boolean {
        const mcpUrl = system.get(AppSystemProp.MCP_URL)
        if (isNil(mcpUrl)) {
            return false
        }
        return findConfiguredBaseUrl(req) === networkUtils.cleanTrailingSlash(mcpUrl)
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

function getConfiguredBaseUrls(): ConfiguredBaseUrl[] {
    const { data: frontendUrl } = tryCatchSync(() => system.getOrThrow(AppSystemProp.FRONTEND_URL))
    return [system.get(AppSystemProp.MCP_URL), frontendUrl]
        .filter((url): url is string => !isNil(url))
        .map((baseUrl) => ({ baseUrl, parsed: tryCatchSync(() => new URL(baseUrl)) }))
        .flatMap(({ baseUrl, parsed }) => parsed.error ? [] : [{
            host: parsed.data.host.toLowerCase(),
            baseUrl: networkUtils.cleanTrailingSlash(baseUrl),
        }])
}

function findConfiguredBaseUrl(req: FastifyRequest): string | null {
    const requestHost = networkUtils.getRequestHost(req).toLowerCase()
    return getConfiguredBaseUrls().find((entry) => entry.host === requestHost)?.baseUrl ?? null
}

type ConfiguredBaseUrl = {
    host: string
    baseUrl: string
}

type PublicUrlParams = {
    path?: string
}

type PublicUrlFromRequestParams = {
    req: FastifyRequest
    path?: string
}

type InternalUrlParams = {
    path: string
}
