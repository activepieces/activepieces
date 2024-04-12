import { flagService } from '../../flags/flag.service'
import { FlagsServiceHooks } from '../../flags/flags.hooks'
import { resolvePlatformIdForRequest } from '../../platform/platform-utils'
import { platformService } from '../../platform/platform.service'
import { appearanceHelper } from '../helper/appearance-helper'
import { ApFlagId, isNil, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'

export const enterpriseFlagsHooks: FlagsServiceHooks = {
    async modify({ flags, request }) {
        const modifiedFlags = { ...flags }
        const hostname = request.hostname
        const platformId = await resolvePlatformIdForRequest(request)
        if (isNil(platformId)) {
            return modifiedFlags
        }
        const platform = await platformService.getOneOrThrow(platformId)
        modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP] = {
            [ThirdPartyAuthnProviderEnum.GOOGLE]: !isNil(
                platform.federatedAuthProviders.google,
            ),
            [ThirdPartyAuthnProviderEnum.GITHUB]: !isNil(
                platform.federatedAuthProviders.github,
            ),
        }
        modifiedFlags[ApFlagId.EMAIL_AUTH_ENABLED] = platform.emailAuthEnabled
        const isCustomerPlatform = !flagService.isCloudPlatform(platformId)
        if (isCustomerPlatform) {
            modifiedFlags[ApFlagId.SHOW_PLATFORM_DEMO] = false
            modifiedFlags[ApFlagId.THEME] = await appearanceHelper.getTheme({
                platformId,
            })
            modifiedFlags[ApFlagId.SHOW_COMMUNITY] = false
            modifiedFlags[ApFlagId.SHOW_DOCS] = false
            modifiedFlags[ApFlagId.SHOW_BILLING] = false
            modifiedFlags[ApFlagId.SHOW_REWARDS] = false
            modifiedFlags[ApFlagId.SHOW_COPILOT] = false
            modifiedFlags[ApFlagId.SHOW_BLOG_GUIDE] = false
            modifiedFlags[ApFlagId.PROJECT_LIMITS_ENABLED] = true
            modifiedFlags[ApFlagId.INSTALL_PROJECT_PIECES_ENABLED] = false
            modifiedFlags[ApFlagId.MANAGE_PROJECT_PIECES_ENABLED] = true
            modifiedFlags[ApFlagId.SHOW_SIGN_UP_LINK] = false
            modifiedFlags[ApFlagId.SHOW_POWERED_BY_AP] = platform.showPoweredBy
            modifiedFlags[ApFlagId.CLOUD_AUTH_ENABLED] = platform.cloudAuthEnabled
            modifiedFlags[ApFlagId.SHOW_GIT_SYNC] = platform.gitSyncEnabled
            modifiedFlags[ApFlagId.FRONTEND_URL] = `https://${hostname}`
            modifiedFlags[
                ApFlagId.WEBHOOK_URL_PREFIX
            ] = `https://${hostname}/api/v1/webhooks`
            modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL] =
        flagService.getThirdPartyRedirectUrl(platform.id, hostname)
            modifiedFlags[ApFlagId.PRIVACY_POLICY_URL] = platform.privacyPolicyUrl
            modifiedFlags[ApFlagId.TERMS_OF_SERVICE_URL] = platform.termsOfServiceUrl
            modifiedFlags[ApFlagId.OWN_AUTH2_ENABLED] = false
            modifiedFlags[ApFlagId.SHOW_PLATFORM_DEMO] = false
            modifiedFlags[ApFlagId.SHOW_ACTIVITY_LOG] = platform.showActivityLog
        }
        return modifiedFlags
    },
}
