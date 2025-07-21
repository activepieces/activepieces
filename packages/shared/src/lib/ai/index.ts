import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { SeekPage } from '../common/seek-page'

export const AIProvider = Type.Object({
    ...BaseModelSchema,
    config: Type.Object({
        apiKey: Type.String(),
    }),
    provider: Type.String({ minLength: 1 }),
    platformId: Type.String(),
})

export type AIProvider = Static<typeof AIProvider>

export const AIProviderWithoutSensitiveData = Type.Omit(AIProvider, ['config'])
export type AIProviderWithoutSensitiveData = Static<typeof AIProviderWithoutSensitiveData>

export const CreateAIProviderRequest = Type.Object({
    provider: Type.String({ minLength: 1 }),
    apiKey: Type.String(),
})

export type CreateAIProviderRequest = Static<typeof CreateAIProviderRequest>

export const AIUsage = Type.Object({
    ...BaseModelSchema,
    provider: Type.String({ minLength: 1 }),
    model: Type.String({ minLength: 1 }),
    cost: Type.Number({ minimum: 0 }),
    projectId: Type.String(),
})

export type AIUsage = Static<typeof AIUsage>

export const ListAICreditsUsageRequest = Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
    cursor: Type.Optional(Type.String()),
})

export type ListAICreditsUsageRequest = Static<typeof ListAICreditsUsageRequest>

export const ListAICreditsUsageResponse = SeekPage(
    Type.Intersect([
        Type.Omit(AIUsage, ['cost']),
        Type.Object({
            credits: Type.Number(),
            projectName: Type.String(),
        }),
    ]),
)

export type ListAICreditsUsageResponse = Static<typeof ListAICreditsUsageResponse>

export const AIErrorResponse = Type.Object({
    error: Type.Object({
        message: Type.String(),
        type: Type.String(),
        code: Type.String(),
    }),
})

export type AIErrorResponse = Static<typeof AIErrorResponse>

export * from './supported-ai-providers'
export * from './ai-sdk'
