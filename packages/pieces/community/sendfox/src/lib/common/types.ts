import type { AppConnectionType } from '@activepieces/pieces-framework';

export type SendfoxAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type SendfoxList = { id: number; name: string };

export type SendfoxPage<T> = {
  current_page?: number;
  data: T[];
  last_page: number;
};
