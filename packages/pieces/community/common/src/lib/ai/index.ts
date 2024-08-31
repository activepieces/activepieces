import { ServerContext } from '@activepieces/pieces-framework';
import { anthropic } from './providers/anthropic';
import { openai } from './providers/openai';

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

export const AI = ({
  provider,
  server
}: { provider: "openai" | "anthropic", server: ServerContext }) => {
  switch (provider) {
    case 'openai':
      return openai({ serverUrl: server.apiUrl, engineToken: server.token })
    case 'anthropic':
      return anthropic({ serverUrl: server.apiUrl, engineToken: server.token })
    default:
      throw new Error(`AI provider ${provider} not supported`)
  }
}
