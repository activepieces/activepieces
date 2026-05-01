import { ApEdition, ApFlagId, isNil, PrincipalType, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'
import { FlagsServiceHooks } from '../../flags/flags.hooks'
import { domainHelper } from '../../helper/domain-helper'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'
import { federatedAuthnService } from '../authentication/federated-authn/federated-authn-service'
import { authnSsoSamlService } from '../authentication/saml-authn/authn-sso-saml-service'
import { embedSubdomainService } from '../embed-subdomain/embed-subdomain.service'
import { appearanceHelper } from '../helper/appearance-helper'

export const enterpriseFlagsHooks: FlagsServiceHooks = {
    async modify({ flags, request }) {
        const modifiedFlags: Record<string, string | boolean | number | string[] | Record<string, unknown>> = { ...flags }
        const platformIdFromPrincipal = !request.principal || request.principal.type === PrincipalType.UNKNOWN || request.principal.type === PrincipalType.WORKER ? null : request.principal.platform.id
        const platformId = platformIdFromPrincipal ?? await platformUtils.getPlatformIdForRequest(request)
        const edition = system.getEdition()
        const googleAuthEnabled = !isNil(system.get(AppSystemProp.GOOGLE_CLIENT_ID)) && !isNil(system.get(AppSystemProp.GOOGLE_CLIENT_SECRET))
        modifiedFlags[ApFlagId.ALLOWED_EMBED_ORIGINS] = system.getList(AppSystemProp.ALLOWED_EMBED_ORIGINS)
        if (isNil(platformId)) {
            if (edition === ApEdition.CLOUD) {
                modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP] = {
                    [ThirdPartyAuthnProviderEnum.GOOGLE]: googleAuthEnabled,
                }
            }
            return modifiedFlags
        }
        const platformWithPlan = await platformService(request.log).getOneWithPlanOrThrow(platformId)
        const platform = await platformService(request.log).getOneOrThrow(platformId)
        modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP] = {
            [ThirdPartyAuthnProviderEnum.GOOGLE]: googleAuthEnabled && platform.googleAuthEnabled,
            [ThirdPartyAuthnProviderEnum.SAML]: !isNil(
                platform.federatedAuthProviders.saml,
            ),
        }
        modifiedFlags[ApFlagId.EMAIL_AUTH_ENABLED] = platform.emailAuthEnabled
        modifiedFlags[ApFlagId.SHOW_POWERED_BY_IN_FORM] = platformWithPlan.plan.showPoweredBy
        modifiedFlags[ApFlagId.THEME] = await appearanceHelper.getTheme({
            platformId,
            log: request.log,
        })
        modifiedFlags[ApFlagId.SHOW_COMMUNITY] = platformWithPlan.plan.showPoweredBy
        modifiedFlags[ApFlagId.SHOW_BILLING_PAGE] = flags[ApFlagId.SHOW_BILLING_PAGE]
        modifiedFlags[ApFlagId.CLOUD_AUTH_ENABLED] = platform.cloudAuthEnabled
        modifiedFlags[ApFlagId.SHOW_BADGES] = !platformWithPlan.plan.embeddingEnabled
        modifiedFlags[ApFlagId.SHOW_PROJECT_MEMBERS] = platformWithPlan.plan.projectRolesEnabled
        modifiedFlags[ApFlagId.PUBLIC_URL] = await domainHelper.getPublicUrl({
            path: '',
        })
        modifiedFlags[ApFlagId.SAML_AUTH_ACS_URL] = await authnSsoSamlService(request.log).getAcsUrl(platformId)

        const embedSubdomainUrl = await embedSubdomainService(request.log).getActiveSubdomainUrl({ platformId })
        if (embedSubdomainUrl) {
            modifiedFlags[ApFlagId.WEBHOOK_URL_PREFIX] = `${embedSubdomainUrl}/api/v1/webhooks`
        }
        else {
            modifiedFlags[
                ApFlagId.WEBHOOK_URL_PREFIX
            ] = await domainHelper.getPublicApiUrl({
                path: '/v1/webhooks',
            })
        }
        modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL] = await federatedAuthnService(request.log).getThirdPartyRedirectUrl()
        return modifiedFlags
    },
}
