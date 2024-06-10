import { defaultTheme, generateTheme } from '../../flags/theme'
import { getEdition } from '../../helper/secret-helper'
import { platformService } from '../../platform/platform.service'
import { activationKeysService } from '../activation-keys/activation-keys-service'
import { logger } from '@activepieces/server-shared'
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
    const edition = getEdition()
    logger.debug('enterpriseThemeChecker')
    if (edition === ApEdition.COMMUNITY || !platform.activationKey) {
        logger.debug('no platform key')
        return defaultTheme
    }
 
    else if (edition === ApEdition.CLOUD) {
        return generateTheme({
            websiteName: platform.name,
            fullLogoUrl: platform.fullLogoUrl,
            favIconUrl: platform.favIconUrl,
            logoIconUrl: platform.logoIconUrl,
            primaryColor: platform.primaryColor,
        })
    }
    else {
        logger.debug('enterprise key: ' + platform.activationKey)
        const verificationResult = await activationKeysService.verifyKey({ key: platform.activationKey })
        if (verificationResult.valid) {
            logger.debug('Returning enterprise theme')
            logger.debug(platform.primaryColor)
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