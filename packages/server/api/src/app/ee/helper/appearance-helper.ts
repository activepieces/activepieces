import { ApEdition, isNil, PlatformWithoutSensitiveData } from '@activepieces/shared'
import { defaultTheme, generateTheme } from '../../flags/theme'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'

const getPlatformByIdOrFallback = async (platformId: string | null) => {
    if (isNil(platformId)) {
        return defaultTheme
    }
    const platform = await platformService.getOneWithPlanOrThrow(platformId)
    
    return enterpriseThemeChecker(platform)
}

export const appearanceHelper = {
    async getTheme({ platformId }: { platformId: string | null }) {
        return getPlatformByIdOrFallback(platformId)
    },
}

const enterpriseThemeChecker = async (platform: PlatformWithoutSensitiveData) => {
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
            if (platform.plan.customAppearanceEnabled) {
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