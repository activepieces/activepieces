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
        const hostUrl = `https://${hostname}`
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
            [ThirdPartyAuthnProviderEnum.SAML]: !isNil(
                platform.federatedAuthProviders.saml,
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
            modifiedFlags[ApFlagId.PROJECT_LIMITS_ENABLED] = true
            modifiedFlags[ApFlagId.INSTALL_PROJECT_PIECES_ENABLED] = false
            modifiedFlags[ApFlagId.MANAGE_PROJECT_PIECES_ENABLED] = true
            modifiedFlags[ApFlagId.SHOW_SIGN_UP_LINK] = false
            modifiedFlags[ApFlagId.CLOUD_AUTH_ENABLED] = platform.cloudAuthEnabled
            modifiedFlags[ApFlagId.FRONTEND_URL] = `${hostUrl}`
            modifiedFlags[ApFlagId.SAML_AUTH_ACS_URL] = `${hostUrl}/api/v1/authn/saml/acs`
            modifiedFlags[
                ApFlagId.WEBHOOK_URL_PREFIX
            ] = `${hostUrl}/api/v1/webhooks`
            modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL] =
        flagService.getThirdPartyRedirectUrl(platform.id, hostname)
            modifiedFlags[ApFlagId.PRIVACY_POLICY_URL] = platform.privacyPolicyUrl
            modifiedFlags[ApFlagId.OWN_AUTH2_ENABLED] = false
        }
        return modifiedFlags
    },
}
