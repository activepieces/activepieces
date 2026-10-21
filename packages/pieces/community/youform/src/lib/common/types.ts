import type { AppConnectionType } from '@activepieces/pieces-framework';

export type YouformAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type YouformUser = { id: number; first_name?: string; last_name?: string; email?: string };
export type YouformForm = {
  id: number;
  name: string;
  slug: string;
  closed?: unknown;
  submissions_count?: number | null;
  created_at?: string;
  updated_at?: string;
};
export type YouformFormDetail = YouformForm & Record<string, unknown>;
export type YouformSubmission = {
  id: number;
  uid?: string;
  form_id?: number;
  data?: Record<string, unknown>;
  is_complete?: number;
  completed_at?: string | null;
  refill_link_enabled?: unknown;
  created_at?: string;
  updated_at?: string;
};
export type YouformPaginator<T> = {
  current_page?: number;
  data: T[];
  last_page?: number;
  per_page?: number;
  total?: number;
  next_page_url?: string | null;
};
export type YouformPage<T> = { data: YouformPaginator<T> };
export type YouformCreateWebhookResponse = { data: { id: number } };
