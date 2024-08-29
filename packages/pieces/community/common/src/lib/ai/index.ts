export interface AI<P extends string, ChatModel extends string> {
  provider: P;
  chat: AIChat<ChatModel>;
}

export interface AIChat<ChatModel extends string> {
  completions: AIChatCompletions<ChatModel>;
}

export interface AIChatCompletions<ChatModel extends string> {
  create: (params: AIChatCompletionsCreateParams<ChatModel>) => Promise<AIChatCompletion>;
}

export interface AIChatCompletionsCreateParams<ChatModel> {
  model: ChatModel;
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
  object: string;
  created: number;
  model: string;
  choices: AIChatCompletionChoice[];
  usage: AIChatCompletionUsage;
}

export interface AIChatCompletionChoice {
  message: AIChatMessage;
  finishReason: string;
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