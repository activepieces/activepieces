import { ServerContext } from '@activepieces/pieces-framework';
import { anthropic } from './providers/anthropic';
import { openai } from './providers/openai';
import { AiProvider, AiProviders } from './providers';

export type AI<SDK> = {
  provider: string;
  chat: AIChat;
}

export type AIChat = {
  text: (params: AIChatCompletionsCreateParams) => Promise<AIChatCompletion>;
}

export type AIChatCompletionsCreateParams = {
  model: string;
  messages: AIChatMessage[];
  creativity?: number;
  maxTokens?: number;
  stop?: string[];
}

export type AIChatCompletion = {
  id: string;
  created: number;
  model: string;
  choices: AIChatMessage[];
  usage?: AIChatCompletionUsage;
}

export type AIChatCompletionUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type AIChatMessage = {
  role: AIChatRole;
  content: string;
}

export enum AIChatRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export type AIFactory = (params: { proxyUrl: string, engineToken: string }) => AI<unknown>

export const AI = ({
  provider,
  server
}: { provider: AiProvider, server: ServerContext }): AI<unknown> => {

  const proxyUrl = `${server.apiUrl}v1/ai-providers/proxy/${provider}` 
  const factory = AiProviders.find(p => p.value === provider)?.factory
  const impl = factory?.({ proxyUrl, engineToken: server.token })

  if (!impl) {
    throw new Error(`AI provider ${provider} is not registered`)
  }

  return {
    provider,
    chat: {
      text: async (params) => {
        try {
          const response = await impl.chat.text(params)
          return response
        } catch (e: any) {
          if (e?.error?.error) {
            throw e.error.error
          }
          throw e
        }
      }
    },
  }
}

export * from './providers'