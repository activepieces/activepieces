import { AuthenticationResponse, MfaChallengeResponse, SAMLAuthnProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { createSamlClient, IdpLoginResponse } from './saml-client'

export const authnSsoSamlService = (log: FastifyBaseLogger) => {
    return {
        async login(platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<LoginResponse> {
            const client = await createSamlClient(platformId, samlProvider)
            const redirectUrl = client.getLoginUrl()
            return {
                redirectUrl,
            }
        },
        async acs(platformId: string, samlProvider: SAMLAuthnProviderConfig, idpLoginResponse: IdpLoginResponse): Promise<AuthenticationResponse | MfaChallengeResponse> {
            const client = await createSamlClient(platformId, samlProvider)
            const _attributes = await client.parseAndValidateLoginResponse(idpLoginResponse)
            return authenticationService(log).socialSignIn({
                // email: attributes.email,
                // firstName: attributes.firstName,
                // lastName: attributes.lastName,
                // newsLetter: false,
                // trackEvents: true,
                // provider: UserIdentityProvider.SAML,
                identityId: '',
                predefinedPlatformId: platformId,
            })
        },
    }
}

type LoginResponse = {
    redirectUrl: string
}