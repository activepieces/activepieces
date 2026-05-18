export interface CohereChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CohereChatRequest {
  model: string;
  messages: CohereChatMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface CohereContentBlock {
  type: 'text';
  text: string;
}

export interface CohereAssistantMessage {
  role: 'assistant';
  content: CohereContentBlock[];
}

export interface CohereBilledUnits {
  input_tokens: number;
  output_tokens: number;
}

export interface CohereUsage {
  billed_units: CohereBilledUnits;
  tokens: {
    input_tokens: number;
    output_tokens: number;
  };
}

export type CohereFinishReason =
  | 'COMPLETE'
  | 'STOP_SEQUENCE'
  | 'MAX_TOKENS'
  | 'TOOL_CALL'
  | 'ERROR'
  | 'TIMEOUT';

export interface CohereChatResponse {
  id: string;
  finish_reason: CohereFinishReason;
  message: CohereAssistantMessage;
  usage: CohereUsage;
}

export interface CohereModelsResponse {
  models: {
    name: string;
    endpoints: string[];
    finetuned: boolean;
    context_length: number;
  }[];
}

export interface CohereErrorResponse {
  message: string;
}
