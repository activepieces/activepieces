import { assertNotNullOrUndefined, isNil, PlatformId } from '@activepieces/core-utils'
import { ApEdition, SAMLAuthnProviderConfig, SsoDomainVerificationStatus, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AuthenticationResult } from '../../../authentication/authentication-utils'
import { authenticationService } from '../../../authentication/authentication.service'
import { domainHelper } from '../../../helper/domain-helper'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { platformUtils } from '../../../platform/platform.utils'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { emailDomainRepo } from '../email-domain/email-domain.service'
import { createSamlClient, IdpLoginResponse } from './saml-client'

export const authnSsoSamlService = (log: FastifyBaseLogger) => {
    return {
        async getAcsUrl(platformId: string): Promise<string> {
            const baseUrl = await domainHelper.getPublicApiUrl({ path: '/v1/authn/saml/acs' })
            if (system.getEdition() === ApEdition.CLOUD) {
                // we still want to support entreprise customers who are still using custom domains . without forcing them to change their saml redirect url
                const legacyHost = await platformUtils.getLegacyHostByPlatformId(platformId)
                if (legacyHost) {
                    return `https://${legacyHost}/api/v1/authn/saml/acs`
                }
                return `${baseUrl}?platformId=${encodeURIComponent(platformId)}`
            }
            return baseUrl
        },
        async getSamlConfigOrThrow(platformId: string | null): Promise<SamlConfigResult> {
            assertNotNullOrUndefined(platformId, 'Platform ID is required for SAML authentication')
            const platform = await platformService(log).getOneWithFederatedAuthOrThrow(platformId)
            const saml = platform.federatedAuthProviders.saml
            assertNotNullOrUndefined(saml, 'SAML IDP metadata is not configured for this platform')
            return { saml, platformId }
        },
        async login(platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<LoginResponse> {
            const acsUrl = await this.getAcsUrl(platformId)

            const client = await createSamlClient({ platformId, samlProvider, acsUrl })
            const redirectUrl = client.getLoginUrl()
            return {
                redirectUrl,
            }
        },
        async acs(platformId: string, samlProvider: SAMLAuthnProviderConfig, idpLoginResponse: IdpLoginResponse): Promise<AuthenticationResult> {
            const acsUrl = await this.getAcsUrl(platformId)
            const client = await createSamlClient({ platformId, samlProvider, acsUrl })
            const attributes = await client.parseAndValidateLoginResponse(idpLoginResponse)
            return authenticationService(log).federatedAuthn({
                email: attributes.email,
                firstName: attributes.firstName,
                lastName: attributes.lastName,
                newsLetter: false,
                trackEvents: true,
                provider: UserIdentityProvider.SAML,
                predefinedPlatformId: platformId,
            })
        },
        async discoverByDomain(domain: string): Promise<DiscoverResult> {
            const platformId = await this.findPlatformIdByDomain({ domain })
            if (isNil(platformId)) {
                return { platformId: null }
            }
            const samlConfigured = await platformService(log).hasSamlConfigured(platformId)
            return { platformId: samlConfigured ? platformId : null }
        },
        async findPlatformIdByDomain({ domain }: FindPlatformIdByDomainParams): Promise<PlatformId | null> {
            const normalizedDomain = domain.trim().toLowerCase()
            if (normalizedDomain.length === 0) {
                return null
            }
            const verifiedDomain = await emailDomainRepo().findOneBy({ domain: normalizedDomain, verificationStatus: SsoDomainVerificationStatus.VERIFIED })
            if (isNil(verifiedDomain)) {
                return null
            }
            const plan = await platformPlanService(log).getOrCreateForPlatform(verifiedDomain.platformId)
            return plan.ssoEnabled ? verifiedDomain.platformId : null
        },
    }
}

type LoginResponse = {
    redirectUrl: string
}

type SamlConfigResult = {
    saml: SAMLAuthnProviderConfig
    platformId: string
}

type DiscoverResult = {
    platformId: string | null
}

type FindPlatformIdByDomainParams = {
    domain: string
}
