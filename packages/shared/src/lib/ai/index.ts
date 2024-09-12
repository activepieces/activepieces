import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";


export const AiProviderConfig = Type.Object({
  ...BaseModelSchema,
  config: Type.Object({
    defaultHeaders: Type.Record(Type.String(), Type.String()),
    creditsCriteria: Type.Record(Type.String(), Type.Number()), // model name to number of credits consumed per request for this model
  }),
  baseUrl: Type.String({
    pattern: '^https?://.+$',
  }),
  provider: Type.String({ minLength: 1 }),
  platformId: Type.String(),
})

export type AiProviderConfig = Static<typeof AiProviderConfig>;

export const AiProviderWithoutSensitiveData = Type.Composite([Type.Omit(AiProviderConfig, ['config']),
Type.Object({
  config: Type.Object({
    creditsCriteria: Type.Record(Type.String(), Type.Number({ minimum: 0 })),
  }),
}),
])
export type AiProviderWithoutSensitiveData = Static<typeof AiProviderWithoutSensitiveData>
