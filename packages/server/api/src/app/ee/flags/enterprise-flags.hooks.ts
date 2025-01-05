import { WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApFlagId, isNil, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'
import { flagService } from '../../flags/flag.service'
import { FlagsServiceHooks } from '../../flags/flags.hooks'
import { system } from '../../helper/system/system'
import { resolvePlatformIdForRequest } from '../../platform/platform-utils'
import { platformService } from '../../platform/platform.service'
import { appearanceHelper } from '../helper/appearance-helper'

export const enterpriseFlagsHooks: FlagsServiceHooks = {
    async modify({ flags, request }) {
        const modifiedFlags = { ...flags }
        const hostUrl = resolveHostUrl(request.hostname)
        const platformId = await resolvePlatformIdForRequest(request)
        if (isNil(platformId)) {
            return modifiedFlags
        }
        const platform = await platformService.getOneOrThrow(platformId)
        modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP] = {
            [ThirdPartyAuthnProviderEnum.GOOGLE]: !isNil(
                platform.federatedAuthProviders.google,
            ),
            [ThirdPartyAuthnProviderEnum.SAML]: !isNil(
                platform.federatedAuthProviders.saml,
            ),
        }
        modifiedFlags[ApFlagId.EMAIL_AUTH_ENABLED] = platform.emailAuthEnabled
        const isCustomerPlatform = !flagService.isCloudPlatform(platformId)
        modifiedFlags[ApFlagId.IS_CLOUD_PLATFORM] = !isCustomerPlatform
        if (isCustomerPlatform) {
            modifiedFlags[ApFlagId.SHOW_POWERED_BY_IN_FORM] = platform.showPoweredBy
            modifiedFlags[ApFlagId.SHOW_PLATFORM_DEMO] = false
            modifiedFlags[ApFlagId.THEME] = await appearanceHelper.getTheme({
                platformId,
            })
            modifiedFlags[ApFlagId.SHOW_COMMUNITY] = false
            modifiedFlags[ApFlagId.SHOW_DOCS] = false
            modifiedFlags[ApFlagId.SHOW_BILLING] = false
            modifiedFlags[ApFlagId.SHOW_REWARDS] = false
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
                flagService.getThirdPartyRedirectUrl(platform.id, request.hostname)
            modifiedFlags[ApFlagId.OWN_AUTH2_ENABLED] = false
        }
        return modifiedFlags
    },
}
function resolveHostUrl(hostname: string): string {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        return `https://${hostname}`
    }
    const frontendUrl = system.getOrThrow(WorkerSystemProp.FRONTEND_URL)
    return removeTrailingSlash(frontendUrl)
}

function removeTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url
}