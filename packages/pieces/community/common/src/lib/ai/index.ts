export interface AI<SDK> {
  provider: string;
  chat: AIChat;
  underlying: SDK;
}

export interface AIChat {
  completions: AIChatCompletions;
}

export interface AIChatCompletions {
  create: (params: AIChatCompletionsCreateParams) => Promise<AIChatCompletion>;
}

export interface AIChatCompletionsCreateParams {
  model: string;
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface AIChatCompletion {
  id: string;
  created: number;
  model: string;
  choices: AIChatMessage[];
  usage?: AIChatCompletionUsage;
}

export interface AIChatCompletionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
}

export enum AIChatRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}