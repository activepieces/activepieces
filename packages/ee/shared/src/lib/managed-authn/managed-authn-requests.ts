import { Type, Static } from '@sinclair/typebox'

export const ManagedAuthnRequestBody = Type.Object({
    platformId: Type.String(),
    externalUserId: Type.String(),
    externalProjectId: Type.String(),
    externalEmail: Type.String(),
    externalFirstName: Type.String(),
    externalLastName: Type.String(),
})

export type ManagedAuthnRequestBody = Static<typeof ManagedAuthnRequestBody>
