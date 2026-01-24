import { ApEdition, ApFlagId, isNil, PrincipalType, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'
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
        const platformIdFromPrincipal = !request.principal || request.principal.type === PrincipalType.UNKNOWN || request.principal.type === PrincipalType.WORKER ? null : request.principal.platform.id
        const platformId = platformIdFromPrincipal ?? await platformUtils.getPlatformIdForRequest(request)
        const edition = system.getEdition()
        if (isNil(platformId)) {
            if (edition === ApEdition.CLOUD) {
                modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP] = {
                    [ThirdPartyAuthnProviderEnum.GOOGLE]: true,
                }
            }
            return modifiedFlags
        }
        modifiedFlags[ApFlagId.CAN_CONFIGURE_AI_PROVIDER] = edition !== ApEdition.CLOUD
        const platformWithPlan = await platformService.getOneWithPlanOrThrow(platformId)
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
        modifiedFlags[ApFlagId.SHOW_POWERED_BY_IN_FORM] = platformWithPlan.plan.showPoweredBy
        modifiedFlags[ApFlagId.THEME] = await appearanceHelper.getTheme({
            platformId,
        })
        modifiedFlags[ApFlagId.SHOW_COMMUNITY] = platformWithPlan.plan.showPoweredBy
        modifiedFlags[ApFlagId.SHOW_BILLING_PAGE] = flags[ApFlagId.SHOW_BILLING_PAGE] && !platformUtils.isCustomerOnDedicatedDomain(platformWithPlan)
        modifiedFlags[ApFlagId.CLOUD_AUTH_ENABLED] = platform.cloudAuthEnabled
        modifiedFlags[ApFlagId.SHOW_BADGES] = !platformWithPlan.plan.embeddingEnabled
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


