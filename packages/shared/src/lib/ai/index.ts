import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";


export const AiProviderConfig = Type.Object({
  ...BaseModelSchema,
  config: Type.Object({
    defaultHeaders: Type.Record(Type.String(), Type.String({ minLength: 1 })),
  }),
  baseUrl: Type.String({
    pattern: '^https?://.+$',
  }),
  provider: Type.String({ minLength: 1 }),
  platformId: Type.String(),
})

export type AiProviderConfig = Static<typeof AiProviderConfig>;

export const AiProviderWithoutSensitiveData = Type.Omit(AiProviderConfig, ['config'])
export type AiProviderWithoutSensitiveData = Static<typeof AiProviderWithoutSensitiveData>
