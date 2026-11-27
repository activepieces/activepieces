import type { AppConnectionType } from '@activepieces/pieces-framework';

export type BeamerAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type BeamerPostTranslation = {
  title?: string;
  content?: string;
  contentHtml?: string;
  language?: string;
  category?: string;
  postUrl?: string;
  linkUrl?: string;
  linkText?: string;
};

export type BeamerPost = {
  id: number;
  date?: string;
  published?: boolean;
  category?: string;
  translations?: BeamerPostTranslation[];
};

export type BeamerCount = { count: number };
