import { ApId, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'

export const ApiKey = z.object({
    ...BaseModelSchema,
    platformId: ApId,
    displayName: z.string(),
    hashedValue: z.string(),
    truncatedValue: z.string(),
    lastUsedAt: Nullable(z.string()),
})

export type ApiKey = z.infer<typeof ApiKey>

export const ApiKeyResponseWithValue = ApiKey.omit({ hashedValue: true }).extend({
    value: z.string(),
})

export type ApiKeyResponseWithValue = z.infer<typeof ApiKeyResponseWithValue>


export const ApiKeyResponseWithoutValue = ApiKey.omit({ hashedValue: true })

export type ApiKeyResponseWithoutValue = z.infer<typeof ApiKeyResponseWithoutValue>


export const CreateApiKeyRequest = z.object({
    displayName: z.string(),
})

export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequest>
