import type { AppConnectionType } from '@activepieces/pieces-framework';

export type GravityFormsAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: { siteUrl: string; consumerKey: string; consumerSecret: string };
};

export type GravityFormsFormSummary = { id: string; title: string; entries?: string };

export type GravityFormsForm = {
  id?: string;
  title?: string;
  description?: string;
  fields?: unknown[];
  [key: string]: unknown;
};

export type GravityFormsEntry = {
  id?: string;
  form_id?: string;
  [key: string]: unknown;
};

export type GravityFormsDeleted<T> = { deleted: boolean; previous: T };

export type GravityFormsSubmissionResult = {
  is_valid: boolean;
  validation_messages?: Record<string, string> | string[];
  page_number?: number;
  source_page_number?: number;
  confirmation_message?: string;
  confirmation_type?: string;
  confirmation_redirect?: string;
  entry_id?: number;
  resume_token?: string;
  is_spam?: boolean;
};

export type GravityFormsFeed = {
  id?: number | string;
  form_id?: number | string;
  addon_slug?: string;
  is_active?: boolean | string;
  feed_order?: number | string;
  meta?: Record<string, unknown>;
};

export type GravityFormsEntryList = { total_count: number; entries: GravityFormsEntry[] };

export type GravityFormsSearch = {
  status?: string;
  field_filters?: Record<string, unknown>;
};
