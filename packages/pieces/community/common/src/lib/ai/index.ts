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
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
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