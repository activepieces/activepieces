import type { AppConnectionType } from '@activepieces/pieces-framework';

export type CometApiAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type CometApiModel = { id: string; owned_by: string };

export type CometApiChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type CometApiChatResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};
