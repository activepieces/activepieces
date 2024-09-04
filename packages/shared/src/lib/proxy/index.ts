import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";

export const ProxyConfig = Type.Object({
  ...BaseModelSchema,
  defaultHeaders: Type.Record(Type.String(), Type.String({ minLength: 1 })),
  baseUrl: Type.String({
    pattern: '^https?://.+$',
  }),
  provider: Type.String({ minLength: 1 }),
  platformId: Type.String(),
})

export type ProxyConfig = Static<typeof ProxyConfig>;

export const AiProviders = [
  {
    label: 'OpenAI' as const, value: 'openai' as const,
    models: [
      { label: 'gpt-4o', value: 'gpt-4o' },
      { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
      { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
      { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
    ]
  },
  {
    label: 'Anthropic' as const,
    value: 'anthropic' as const,
    models: [
      {
        label: 'claude-3-5-sonnet-20240620',
        value: 'claude-3-5-sonnet-20240620'
      },
      {
        label: 'claude-3-opus-20240229',
        value: 'claude-3-opus-20240229',
      },
      {
        label: 'claude-3-sonnet-20240229',
        value: 'claude-3-sonnet-20240229',
      },
      {
        label: 'claude-3-haiku-20240307',
        value: 'claude-3-haiku-20240307',
      },
    ]
  },
]

export const AiProvider = Type.Union(AiProviders.map(p => Type.Literal(p.value)))

export type AiProvider = Static<typeof AiProvider>