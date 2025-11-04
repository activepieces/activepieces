import { Static, Type } from '@sinclair/typebox'

export const AddSigningKeyRequestBody = Type.Object({
    displayName: Type.String(),
})

export type AddSigningKeyRequestBody = Static<typeof AddSigningKeyRequestBody>
