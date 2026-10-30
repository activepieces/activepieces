import type { AppConnectionType } from '@activepieces/pieces-framework';

export type PerplexityAiAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type PerplexityAiMessage = { role: string; content: unknown };

export type PerplexityAiChatCompletion = {
  choices: { message: { content: string } }[];
  citations?: string[];
};

export type PerplexityAiAgentResponse = {
  id: string;
  object: 'response';
  created_at: number;
  model: string;
  status:
    | 'completed'
    | 'failed'
    | 'incomplete'
    | 'in_progress'
    | 'queued'
    | 'cancelled';
  output: unknown[];
  effort?: string;
  error?: unknown;
  usage?: unknown;
};

export type PerplexityAiList<T> = { object: string; data: T[] };
