import { Static, Type } from '@sinclair/typebox'

export const ManagedAuthnRequestBody = Type.Object({
  externalAccessToken: Type.String(),
})

export type ManagedAuthnRequestBody = Static<typeof ManagedAuthnRequestBody>
