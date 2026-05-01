import { ApEdition, AuthenticationResponse, SAMLAuthnProviderConfig, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { domainHelper } from '../../../helper/domain-helper'
import { system } from '../../../helper/system/system'
import { createSamlClient, IdpLoginResponse } from './saml-client'

export const authnSsoSamlService = (log: FastifyBaseLogger) => {
    return {
        async getAcsUrl(platformId: string): Promise<string> {
            const baseUrl = await domainHelper.getPublicApiUrl({ path: '/v1/authn/saml/acs' })
            return system.getEdition() === ApEdition.CLOUD
                ? `${baseUrl}?platformId=${encodeURIComponent(platformId)}`
                : baseUrl
        },
        async login(platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<LoginResponse> {
            const acsUrl = await this.getAcsUrl(platformId)
            const client = await createSamlClient({ platformId, samlProvider, acsUrl })
            const redirectUrl = client.getLoginUrl()
            return {
                redirectUrl,
            }
        },
        async acs(platformId: string, samlProvider: SAMLAuthnProviderConfig, idpLoginResponse: IdpLoginResponse): Promise<AuthenticationResponse> {
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
    }
}

type LoginResponse = {
    redirectUrl: string
}