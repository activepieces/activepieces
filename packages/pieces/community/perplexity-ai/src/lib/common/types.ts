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
