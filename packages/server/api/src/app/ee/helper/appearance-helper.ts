import { isNil } from '@activepieces/core-utils'
import { ApEdition, PlatformWithoutSensitiveData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { defaultTheme, generateTheme } from '../../flags/theme'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'

const getPlatformByIdOrFallback = async (platformId: string | null, log: FastifyBaseLogger) => {
    if (isNil(platformId)) {
        return defaultTheme
    }
    const platform = await platformService(log).getOneWithPlanOrThrow(platformId)

    return enterpriseThemeChecker(platform)
}

export const appearanceHelper = {
    async getTheme({ platformId, log }: { platformId: string | null, log: FastifyBaseLogger }) {
        return getPlatformByIdOrFallback(platformId, log)
    },
}

const enterpriseThemeChecker = async (platform: PlatformWithoutSensitiveData) => {
    if (system.getEdition() === ApEdition.COMMUNITY || !platform.plan.customAppearanceEnabled) {
        return defaultTheme
    }
    return generateTheme({
        websiteName: platform.name,
        fullLogoUrl: platform.fullLogoUrl,
        favIconUrl: platform.favIconUrl,
        logoIconUrl: platform.logoIconUrl,
        primaryColor: platform.primaryColor,
        themeColors: platform.themeColors ?? undefined,
    })
}
