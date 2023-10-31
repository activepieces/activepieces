import { Static, Type } from "@sinclair/typebox";
import { SigningKey } from "./signing-key-model";

export const CreateSigningKeyRequest = Type.Object({
    displayName: Type.String()
})

export type CreateSigningKeyRequest = Static<typeof CreateSigningKeyRequest>;

export type CreateSigningKeyResponse = SigningKey & {
    privateKey: string
}