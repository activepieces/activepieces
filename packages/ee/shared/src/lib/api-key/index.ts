import { ApId, BaseModelSchema } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const ApiKey = Type.Object({
    ...BaseModelSchema,
    platformId: ApId,
    displayName: Type.String(),
    hashedValue: Type.String(),
    truncatedValue: Type.String(),
})

export type ApiKey = Static<typeof ApiKey>

export const ApiKeyResponseWithValue = Type.Composite([
    Type.Omit(ApiKey, ['hashedValue']),
    Type.Object({
        value: Type.String(),
    }),
])

export type ApiKeyResponseWithValue = Static<typeof ApiKeyResponseWithValue>


export const ApiKeyResponseWithoutValue = Type.Omit(ApiKey, ['hashedValue'])

export type ApiKeyResponseWithoutValue = Static<typeof ApiKeyResponseWithoutValue>


export const CreateApiKeyRequest = Type.Object({
    displayName: Type.String(),
})

export type CreateApiKeyRequest = Static<typeof CreateApiKeyRequest>
