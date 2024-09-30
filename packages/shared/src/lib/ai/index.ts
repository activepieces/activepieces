import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'


export const AiProviderConfig = Type.Object({
    ...BaseModelSchema,
    config: Type.Object({
        defaultHeaders: Type.Record(Type.String(), Type.String()),
    }),
    baseUrl: Type.String({
        pattern: '^https?://.+$',
    }),
    provider: Type.String({ minLength: 1 }),
    platformId: Type.String(),
})

export type AiProviderConfig = Static<typeof AiProviderConfig>

export const AiProviderWithoutSensitiveData = Type.Composite([Type.Omit(AiProviderConfig, ['config']),
    Type.Object({
        config: Type.Object({
        }),
    }),
])
export type AiProviderWithoutSensitiveData = Static<typeof AiProviderWithoutSensitiveData>
