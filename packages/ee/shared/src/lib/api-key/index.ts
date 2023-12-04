import { ApId, BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export const ApiKey = Type.Object({
    ...BaseModelSchema,
    platformId: ApId,
    displayName: Type.String(),
    hashedValue: Type.String(),
    truncatedValue: Type.String(),
})

export type ApiKey = Static<typeof ApiKey>

export type AddApiKeyResponse = ApiKey & {
    value: string
}

export const CreateApiKeyRequest = Type.Object({
    displayName: Type.String()
})

export type CreateApiKeyRequest = Static<typeof CreateApiKeyRequest>
