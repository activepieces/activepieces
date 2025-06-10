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

export * from './supported-ai-providers'
export * from './ai-sdk'
