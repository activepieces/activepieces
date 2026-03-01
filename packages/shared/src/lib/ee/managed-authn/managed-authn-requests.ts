import { Static, Type } from '@sinclair/typebox'

export const ManagedAuthnRequestBody = Type.Object({
    //if you change this you need to update the embed-sdk I can't import it there because it can't have dependencies 
    externalAccessToken: Type.String(),
})

export type ManagedAuthnRequestBody = Static<typeof ManagedAuthnRequestBody>
