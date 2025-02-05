import { ApEdition, ApFlagId, isNil, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'
import { FlagsServiceHooks } from '../../flags/flags.hooks'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'
import { federatedAuthnService } from '../authentication/federated-authn/federated-authn-service'
import { domainHelper } from '../custom-domains/domain-helper'
import { appearanceHelper } from '../helper/appearance-helper'

export const enterpriseFlagsHooks: FlagsServiceHooks = {
    async modify({ flags, request }) {
        const modifiedFlags: Record<string, string | boolean | number | Record<string, unknown>> = { ...flags }
        const platformId = await platformUtils.getPlatformIdForRequest(request)
        if (isNil(platformId)) {
            const edition = system.getEdition()
            if (edition === ApEdition.CLOUD) {
                modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP] = {
                    [ThirdPartyAuthnProviderEnum.GOOGLE]: true,
                }
            }
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
        modifiedFlags[ApFlagId.SHOW_POWERED_BY_IN_FORM] = platform.showPoweredBy
        modifiedFlags[ApFlagId.THEME] = await appearanceHelper.getTheme({
            platformId,
        })
        modifiedFlags[ApFlagId.SHOW_COMMUNITY] = platform.showPoweredBy
        modifiedFlags[ApFlagId.SHOW_DOCS] = platform.showPoweredBy
        modifiedFlags[ApFlagId.SHOW_BILLING] = false
        modifiedFlags[ApFlagId.PROJECT_LIMITS_ENABLED] = true
        modifiedFlags[ApFlagId.CLOUD_AUTH_ENABLED] = platform.cloudAuthEnabled
        modifiedFlags[ApFlagId.PUBLIC_URL] = await domainHelper.getPublicUrl({
            path: '',
            platformId,
        })
        modifiedFlags[ApFlagId.SAML_AUTH_ACS_URL] = await domainHelper.getInternalApiUrl({
            path: '/v1/authn/saml/acs',
            platformId,
        })
        modifiedFlags[
            ApFlagId.WEBHOOK_URL_PREFIX
        ] = await domainHelper.getPublicApiUrl({
            path: '/v1/webhooks',
            platformId,
        })
        modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL] = await federatedAuthnService(request.log).getThirdPartyRedirectUrl(platformId)
        return modifiedFlags
    },
}


