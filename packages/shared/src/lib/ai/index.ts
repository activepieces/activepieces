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

type HeaderValueMapper = (value: string) => string

export type AuthHeader = {
  name: string
  mapper: HeaderValueMapper
}

type AuthHeaderOptions =
  | { bearer: true }
  | { bearer: false, name: string, mapper?: HeaderValueMapper }

const headerValueMappers = {
  bearer: (value: string) => `Bearer ${value}`,
  default: (value: string) => value
}

const authHeader = (options: AuthHeaderOptions): AuthHeader => ({
  name: options.bearer ? 'Authorization' as const : options.name,
  mapper: options.bearer ? headerValueMappers.bearer : options.mapper ?? headerValueMappers.default,
})

export const AiProviders = [
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
    defaultBaseUrl: 'https://api.openai.com',
    label: 'OpenAI' as const, value: 'openai' as const,
    models: [
      { label: 'gpt-4o', value: 'gpt-4o' },
      { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
      { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
      { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
    ],
    auth: authHeader({ bearer: true })
  },
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
    defaultBaseUrl: 'https://api.anthropic.com',
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
    ],
    auth: authHeader({ name: "x-api-key", bearer: false })
  },
]

export const AiProvider = Type.Union(AiProviders.map(p => Type.Literal(p.value)))

export type AiProvider = Static<typeof AiProvider>