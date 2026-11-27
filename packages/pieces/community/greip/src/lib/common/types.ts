import type { AppConnectionType } from '@activepieces/pieces-framework';

export type GreipAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type GreipErrorBody = {
  status?: string;
  code?: number;
  type?: string;
  description?: string;
  message?: string;
  error?: string;
  response?: { body?: GreipErrorBody };
};
