import { defaultTheme, generateTheme } from '../../flags/theme'
import { platformService } from '../../platform/platform.service'
import { system } from '@activepieces/server-shared'
import { ApEdition, isNil, Platform } from '@activepieces/shared'

const getPlatformByIdOrFallback = async (platformId: string | null) => {
    if (isNil(platformId)) {
        return defaultTheme
    }
    const platform = await platformService.getOneOrThrow(platformId)
    
    return enterpriseThemeChecker(platform)
}

export const appearanceHelper = {
    async getTheme({ platformId }: { platformId: string | null }) {
        return getPlatformByIdOrFallback(platformId)
    },
}

const enterpriseThemeChecker = async (platform: Platform) => {
    const edition = system.getEdition()
    switch (edition) {
        case ApEdition.COMMUNITY:
            return defaultTheme
        case ApEdition.CLOUD:
            return generateTheme({
                websiteName: platform.name,
                fullLogoUrl: platform.fullLogoUrl,
                favIconUrl: platform.favIconUrl,
                logoIconUrl: platform.logoIconUrl,
                primaryColor: platform.primaryColor,
            })
        case ApEdition.ENTERPRISE:
            if (platform.customAppearanceEnabled) {
                return generateTheme({
                    websiteName: platform.name,
                    fullLogoUrl: platform.fullLogoUrl,
                    favIconUrl: platform.favIconUrl,
                    logoIconUrl: platform.logoIconUrl,
                    primaryColor: platform.primaryColor,
                })
            }
            return defaultTheme
    }
}