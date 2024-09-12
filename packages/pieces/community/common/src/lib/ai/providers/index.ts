import { Static, Type } from "@sinclair/typebox"
import { anthropic } from "./anthropic"
import { openai } from "./openai"
import { authHeader } from "./utils"

export const AiProviders = [
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
    defaultBaseUrl: 'https://api.openai.com',
    label: 'OpenAI' as const, 
    value: 'openai' as const,
    models: [
      { label: 'gpt-4o', value: 'gpt-4o' },
      { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
      { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
      { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
    ],
    auth: authHeader({ bearer: true }),
    factory: openai,
  },
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
    defaultBaseUrl: 'https://api.anthropic.com',
    label: 'Anthropic' as const,
    value: 'anthropic' as const,
    models: [
      {
        label: 'claude-3-5-sonnet',
        value: 'claude-3-5-sonnet-20240620'
      },
      {
        label: 'claude-3-opus',
        value: 'claude-3-opus-20240229',
      },
      {
        label: 'claude-3-sonnet',
        value: 'claude-3-sonnet-20240229',
      },
      {
        label: 'claude-3-haiku',
        value: 'claude-3-haiku-20240307',
      },
    ],
    auth: authHeader({ name: "x-api-key", bearer: false }),
    factory: anthropic,
  },
]

export type AiProviderMetadata = typeof AiProviders[number]

export const AiProvider = Type.Union(AiProviders.map(p => Type.Literal(p.value)))

export type AiProvider = Static<typeof AiProvider>

export * from './utils'
