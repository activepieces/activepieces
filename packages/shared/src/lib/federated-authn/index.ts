import { Static, Type } from '@sinclair/typebox'
import { ThirdPartyAuthnProviderEnum } from './authn-provider-name'

export * from './authn-provider-name'

export const federatedAuthnLoginResponse = Type.Object({
    loginUrl: Type.String(),
})
export type FederatedAuthnLoginResponse = Static<typeof federatedAuthnLoginResponse>


export const ClaimTokenRequest = Type.Object({
    providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
    code: Type.String(),
})

export type ClaimTokenRequest = Static<typeof ClaimTokenRequest>

export const GoogleAuthnProviderConfig = Type.Object({
    clientId: Type.String(),
    clientSecret: Type.String(),
})
export type GoogleAuthnProviderConfig = Static<typeof GoogleAuthnProviderConfig>

export const GithubAuthnProviderConfig = Type.Object({
    clientId: Type.String(),
    clientSecret: Type.String(),
})
export type GithubAuthnProviderConfig = Static<typeof GithubAuthnProviderConfig>

export const SAMLAuthnProviderConfig = Type.Object({
    idpMetadata: Type.String(),
    idpCertificate: Type.String(),
})
export type SAMLAuthnProviderConfig = Static<typeof SAMLAuthnProviderConfig>

export const FederatedAuthnProviderConfig = Type.Object({
    google: Type.Optional(GoogleAuthnProviderConfig),
    github: Type.Optional(GithubAuthnProviderConfig),
    saml: Type.Optional(SAMLAuthnProviderConfig),
})
export type FederatedAuthnProviderConfig = Static<typeof FederatedAuthnProviderConfig>

export const FederatedAuthnProviderConfigWithoutSensitiveData = Type.Object({
    google: Type.Optional(Type.Pick(GoogleAuthnProviderConfig, ['clientId'])),
    github: Type.Optional(Type.Pick(GithubAuthnProviderConfig, ['clientId'])),
    saml: Type.Optional(Type.Object({})),
})

export type FederatedAuthnProviderConfigWithoutSensitiveData = Static<typeof FederatedAuthnProviderConfigWithoutSensitiveData>