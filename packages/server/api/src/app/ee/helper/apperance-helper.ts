import { isNil } from '@activepieces/shared'
import { defaultTheme, generateTheme } from '../../flags/theme'
import { platformService } from '../../platform/platform.service'

const getPlatformByIdOrFallback = async (platformId: string | null) => {
    if (isNil(platformId)) {
        return defaultTheme
    }

    const platform = await platformService.getOneOrThrow(platformId)
    return generateTheme({
        websiteName: platform.name,
        fullLogoUrl: platform.fullLogoUrl,
        favIconUrl: platform.favIconUrl,
        logoIconUrl: platform.logoIconUrl,
        primaryColor: platform.primaryColor,
    })
}

export const apperanceHelper = {
    async getTheme({ platformId }: { platformId: string | null }) {
        return getPlatformByIdOrFallback(platformId)
    },
}
