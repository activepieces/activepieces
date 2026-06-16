import { tryCatchSync } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { networkUtils } from './network-utils'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

export const domainHelper = {
    async getPublicUrl({ path }: PublicUrlParams): Promise<string> {
        return networkUtils.combineUrl(system.getOrThrow(AppSystemProp.FRONTEND_URL), path ?? '')
    },
    getPublicUrlFromRequest({ req, path }: PublicUrlFromRequestParams): string {
        const requestBase = networkUtils.getRequestBaseUrl(req)
        const baseWithPrefix = networkUtils.combineUrl(requestBase, getConfiguredBasePath())
        return cleanTrailingSlash(networkUtils.combineUrl(baseWithPrefix, path ?? ''))
    },
    async getPublicApiUrl({ path }: PublicUrlParams): Promise<string> {
        return domainHelper.getPublicUrl({ path: `/api/${cleanLeadingSlash(path ?? '')}` })
    },
    async getInternalUrl({ path }: InternalUrlParams): Promise<string> {
        const internalUrl = system.get(AppSystemProp.INTERNAL_URL)
        if (internalUrl) {
            return networkUtils.combineUrl(internalUrl, path ?? '')
        }
        return this.getPublicUrl({ path })
    },
    async getInternalApiUrl({ path }: InternalUrlParams): Promise<string> {
        return this.getInternalUrl({ path: `/api/${cleanLeadingSlash(path ?? '')}` })
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

function cleanLeadingSlash(path: string) {
    return path.startsWith('/') ? path.slice(1) : path
}

function cleanTrailingSlash(url: string) {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

function getConfiguredBasePath(): string {
    const { data: url } = tryCatchSync(() => new URL(system.getOrThrow(AppSystemProp.FRONTEND_URL)))
    return url && url.pathname !== '/' ? url.pathname : ''
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
