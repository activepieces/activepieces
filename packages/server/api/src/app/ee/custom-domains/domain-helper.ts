import { networkUtils, AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, isNil } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { customDomainService } from './custom-domain.service'

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
        return networkUtils.combineUrl(system.getOrThrow(AppSystemProp.FRONTEND_URL), path ?? '')
    },
    async getPublicApiUrl({ path, platformId }: PublicUrlParams): Promise<string> {
        return domainHelper.getPublicUrl({ path: `/api/${path}`, platformId })
    }
}



type PublicUrlParams = {
    path?: string
    platformId?: string | null | undefined
}

type InternalUrlParams = {
    path: string
}
