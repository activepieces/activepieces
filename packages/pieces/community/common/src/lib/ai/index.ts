import { ServerContext } from '@activepieces/pieces-framework';
import { anthropic } from './providers/anthropic';
import { openai } from './providers/openai';
import { AiProvider } from '@activepieces/shared';

export type AI<SDK> = {
  provider: string;
  chat: AIChat;
  underlying: SDK;
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

const factories = {
  openai,
  anthropic
}

export const AI = ({
  provider,
  server
}: { provider: AiProvider, server: ServerContext }): AI<unknown> => {

  const impl = factories[provider]({ serverUrl: server.apiUrl, engineToken: server.token })
  
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
    underlying: impl,
  }
}
