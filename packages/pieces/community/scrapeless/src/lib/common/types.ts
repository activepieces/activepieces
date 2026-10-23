import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ScrapelessAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type ScrapelessAccount = {
  userId?: string;
  status?: number;
  credits?: string;
  excessCredits?: string;
  plan?: {
    credits?: string;
    endAt?: string;
    price?: number;
    status?: number;
    usage?: number;
  };
};

export type ScrapelessScraperTask = {
  completed: boolean;
  taskId: string | null;
  data: unknown;
};

export type ScrapelessScraperInput = Record<string, unknown>;

export type ScrapelessScrapeOptions = {
  formats?: string[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
  timeout?: number;
};

export type ScrapelessBrowserOptions = {
  proxy_country?: string;
};
