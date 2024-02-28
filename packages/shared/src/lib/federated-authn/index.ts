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


export const FederatedAuthnProviderConfig = Type.Object({
    google: Type.Optional(GoogleAuthnProviderConfig),
    github: Type.Optional(GithubAuthnProviderConfig),
})
export type FederatedAuthnProviderConfig = Static<typeof FederatedAuthnProviderConfig>

export const FederatedAuthnProviderConfigWithoutSensitiveData = Type.Object({
    google: Type.Optional(Type.Omit(GoogleAuthnProviderConfig, ['clientSecret'])),
    github: Type.Optional(Type.Omit(GithubAuthnProviderConfig, ['clientSecret'])),
})