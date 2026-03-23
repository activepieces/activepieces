import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'

export const OAuthApp = z.object({
    ...BaseModelSchema,
    pieceName: z.string(),
    platformId: z.string(),
    clientId: z.string(),
})

export type OAuthApp = z.infer<typeof OAuthApp>

export const UpsertOAuth2AppRequest = z.object({
    pieceName: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
})

export type UpsertOAuth2AppRequest = z.infer<typeof UpsertOAuth2AppRequest>

export const ListOAuth2AppRequest = z.object({
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
})

export type ListOAuth2AppRequest = z.infer<typeof ListOAuth2AppRequest>
