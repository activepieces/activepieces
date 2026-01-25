import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'
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

export const OidcAuthnProviderConfig = Type.Object({
    issuerUrl: Type.String(),
    clientId: Type.String(),
    clientSecret: Type.String(),
    scope: Type.Optional(Type.String()),
})
export type OidcAuthnProviderConfig = Static<typeof OidcAuthnProviderConfig>

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

export const FederatedAuthnProviderConfig = Type.Partial(Type.Object({
    google: Nullable(GoogleAuthnProviderConfig),
    github: Nullable(GithubAuthnProviderConfig),
    oidc: Nullable(OidcAuthnProviderConfig),
    saml: Nullable(SAMLAuthnProviderConfig),
}))
export type FederatedAuthnProviderConfig = Static<typeof FederatedAuthnProviderConfig>

export const FederatedAuthnProviderConfigWithoutSensitiveData = Type.Object({
    google: Nullable(Type.Pick(GoogleAuthnProviderConfig, ['clientId'])),
    github: Nullable(Type.Pick(GithubAuthnProviderConfig, ['clientId'])),
    oidc: Nullable(Type.Pick(OidcAuthnProviderConfig, ['issuerUrl', 'clientId', 'scope'])),
    saml: Nullable(Type.Object({})),
})

export type FederatedAuthnProviderConfigWithoutSensitiveData = Static<typeof FederatedAuthnProviderConfigWithoutSensitiveData>

export const FederatedAuthnProviderConfigWithoutSensitiveDataPartial = Type.Partial(
    FederatedAuthnProviderConfigWithoutSensitiveData,
)

export type FederatedAuthnProviderConfigWithoutSensitiveDataPartial = Static<typeof FederatedAuthnProviderConfigWithoutSensitiveDataPartial>