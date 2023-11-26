import { Static, Type } from '@sinclair/typebox'

export * from './authn-provider-name'

export const federatedAuthnLoginResponse = Type.Object({
    loginUrl :Type.String()
})
export type FederatedAuthnLoginResponse = Static<typeof federatedAuthnLoginResponse>;