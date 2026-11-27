import type { HttpMethod } from '@activepieces/pieces-common';

export type ConvertRequest = {
  url?: string;
  html?: string;
  markdown?: string;
  title?: string;
  source_url?: string;
  output?: string;
  page_size?: string;
  css_url?: string;
  header_text?: string;
  header_image_url?: string;
  lang?: string;
  dir?: string;
  include_links?: boolean;
  async?: boolean;
};

export type DocumentMetadata = {
  title?: string;
  url?: string;
  site?: string;
  excerpt?: string;
  image?: string;
  word_count?: number;
  content_html?: string;
  content_markdown?: string;
};

export type Usage = {
  plan?: string;
  used_this_period?: number;
  included?: number;
  remaining?: number;
};

export type ConvertResponse = {
  status: string;
  output?: string;
  file_url?: string;
  expires_at?: string;
  size_bytes?: number;
  content?: string;
  document?: DocumentMetadata;
  usage?: Usage;
};

export type AsyncConvertResponse = {
  status: string;
  job_id: string;
  status_url: string;
  expires_at?: string;
};

export type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export type JobError = {
  code?: string;
  message?: string;
  retryable?: boolean;
};

export type JobResponse = {
  status: JobStatus;
  job_id: string;
  created_at?: string;
  finished_at?: string;
  result?: ConvertResponse;
  error?: JobError;
};

export type UsageResponse = {
  status?: string;
  usage?: Usage;
};

export type FlatResultFields = {
  output: string | null;
  file_url: string | null;
  content: string | null;
  expires_at: string | null;
  size_bytes: number | null;
  document_title: string | null;
  document_url: string | null;
  document_site: string | null;
  document_excerpt: string | null;
  document_image: string | null;
  document_word_count: number | null;
  document_content_html: string | null;
  document_content_markdown: string | null;
  usage_plan: string | null;
  usage_used_this_period: number | null;
  usage_included: number | null;
  usage_remaining: number | null;
};

export type FlatConvertResponse = FlatResultFields & {
  status: 'success';
};

export type FlatAsyncConvertResponse = {
  status: string;
  job_id: string;
  status_url: string;
  expires_at: string | null;
};

export type FlatJobResponse = FlatResultFields & {
  status: JobStatus;
  job_id: string;
  created_at: string | null;
  finished_at: string | null;
  error_code: string | null;
  error_message: string | null;
  error_retryable: boolean | null;
};

export type PrintFriendlyApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
};
