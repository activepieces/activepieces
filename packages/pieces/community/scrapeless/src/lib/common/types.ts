import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ScrapelessAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};
