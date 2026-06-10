import { networkUtils } from './network-utils'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

export const domainHelper = {
    async getPublicUrl({ path }: PublicUrlParams): Promise<string> {
        return networkUtils.combineUrl(system.getOrThrow(AppSystemProp.FRONTEND_URL), path ?? '')
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

type PublicUrlParams = {
    path?: string
}

type InternalUrlParams = {
    path: string
}
