import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'

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
