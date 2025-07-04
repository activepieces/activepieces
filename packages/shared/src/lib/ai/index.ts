import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

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
