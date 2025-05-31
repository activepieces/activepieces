import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const ConfiguredAIProvider = Type.Object({
    ...BaseModelSchema,
    apiKey: Type.String(),
    provider: Type.String({ minLength: 1 }),
    platformId: Type.String(),
})

export type ConfiguredAIProvider = Static<typeof ConfiguredAIProvider>

export const ConfiguredAIProviderWithoutSensitiveData = Type.Omit(ConfiguredAIProvider, ['apiKey'])
export type ConfiguredAIProviderWithoutSensitiveData = Static<typeof ConfiguredAIProviderWithoutSensitiveData>

export const CreateAIProviderRequest = Type.Object({
    provider: Type.String({ minLength: 1 }),
    apiKey: Type.Optional(Type.String()),
})

export type CreateAIProviderRequest = Static<typeof CreateAIProviderRequest>

export * from './supported-ai-providers'
