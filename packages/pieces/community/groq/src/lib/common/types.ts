import type { AppConnectionType } from '@activepieces/pieces-framework';

export type GroqAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type GroqModel = { id: string };

export type GroqModelList = { data: GroqModel[] };

export type GroqChatMessage = { role: string; content: unknown };

export type GroqChatCompletion = {
  choices: { message: { role: string; content: string } }[];
};
