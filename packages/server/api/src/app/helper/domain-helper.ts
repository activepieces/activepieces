import { AppSystemProp, networkUtils, WorkerSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { system } from './system/system'

export const domainHelper = {
    async getPublicUrl({ path }: PublicUrlParams): Promise<string> {
        return networkUtils.combineUrl(system.getOrThrow(WorkerSystemProp.FRONTEND_URL), path ?? '')
    },
    async getPublicApiUrl({ path, platformId }: PublicUrlParams): Promise<string> {
        return domainHelper.getPublicUrl({ path: `/api/${cleanLeadingSlash(path ?? '')}`, platformId })
    },
    async getInternalUrl({ path, platformId }: InternalUrlParams): Promise<string> {
        const internalUrl = system.get(AppSystemProp.INTERNAL_URL)
        if (!isNil(internalUrl)) {
            return networkUtils.combineUrl(internalUrl, path ?? '')
        }
        return this.getPublicUrl({ path, platformId })
    },
    async getInternalApiUrl({ path, platformId }: InternalUrlParams): Promise<string> {
        return this.getInternalUrl({ path: `/api/${cleanLeadingSlash(path ?? '')}`, platformId })
    },
}


function cleanLeadingSlash(path: string) {
    return path.startsWith('/') ? path.slice(1) : path
}

type PublicUrlParams = {
    path?: string
    platformId?: string | null | undefined
}

type InternalUrlParams = {
    path: string
    platformId?: string | null | undefined
}
