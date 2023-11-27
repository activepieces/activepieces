import { Static, Type } from '@sinclair/typebox'
import { ThirdPartyAuthnProviderEnum } from './authn-provider-name';

export * from './authn-provider-name'

export const federatedAuthnLoginResponse = Type.Object({
    loginUrl :Type.String()
})
export type FederatedAuthnLoginResponse = Static<typeof federatedAuthnLoginResponse>;


export const ClaimTokenRequest = Type.Object({
    providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
    code: Type.String(),
})

export type ClaimTokenRequest = Static<typeof ClaimTokenRequest>