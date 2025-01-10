import { networkUtils, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, isNil } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { customDomainService } from './custom-domain.service'
import { AppSystemProp } from '../../helper/system/system-prop'

export const domainHelper = {
    async getPublicUrl({ path, platformId }: PublicUrlParams): Promise<string> {
        const edition = system.getEdition()
        if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition) && !isNil(platformId)) {
            const customDomain = await customDomainService.getOneByPlatform({
                platformId,
            })
            if (!isNil(customDomain)) {
                return networkUtils.combineUrl(customDomain.domain, path ?? '')
            }
        }
        const publicUrl = system.get(AppSystemProp.PUBLIC_URL)
        if (!isNil(publicUrl)) {
            return networkUtils.combineUrl(publicUrl, path ?? '')
        }
        return domainHelper.getInternalUrl({ path: path ?? '' })
    },
    async getPublicApiUrl({ path, platformId }: PublicUrlParams): Promise<string> {
        return domainHelper.getPublicUrl({ path: `/api/${path}`, platformId })
    },
    async getInternalUrl({ path }: InternalUrlParams): Promise<string> {
        return networkUtils.combineUrl(system.getOrThrow(WorkerSystemProp.FRONTEND_URL), path)
    },
    async getInternalApiUrl({ path }: InternalUrlParams): Promise<string> {
        return domainHelper.getInternalUrl({ path: `/api/${path}` })
    },
}



type PublicUrlParams = {
    path?: string
    platformId?: string | null | undefined
}

type InternalUrlParams = {
    path: string
}
