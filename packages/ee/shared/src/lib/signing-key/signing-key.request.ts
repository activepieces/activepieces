import { Static, Type } from "@sinclair/typebox";

export const CreateSigningKeyRequest = Type.Object({
    displayName: Type.String()
})

export type CreateSigningKeyRequest = Static<typeof CreateSigningKeyRequest>;