import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ParseurAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type ParseurWebhookEvent =
  | 'document.processed'
  | 'document.processed.flattened'
  | 'document.template_needed'
  | 'document.export_failed'
  | 'table.processed';

export type ParseurWebhook = {
  id: number;
  event: ParseurWebhookEvent;
  target: string;
  name: string;
  headers: Record<string, string>;
  category: 'CUSTOM' | 'ZAPIER' | 'MAKE' | 'FLOW' | 'N8N';
  parser_field_set: string[];
};

export type ParseurWebhookInformation = {
  webhookId: number;
};

type ParseurTemplateSample = {
  template_id: number;
  name: string;
  sample_count: number;
};

type ParseurOcrPage = {
  image: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
  position: number;
  included_in_range: boolean;
};

type ParseurDocumentStatus =
  | 'INCOMING'
  | 'ANALYZING'
  | 'PROGRESS'
  | 'PARSEDOK'
  | 'PARSEDKO'
  | 'SKIPPED'
  | 'SPLIT'
  | 'EXPORTKO'
  | 'TRANSKO'
  | 'INVALID';

type ParseurDocumentStatusSource =
  | 'AI'
  | 'AUTO'
  | 'CSV'
  | 'METADATA'
  | 'TEMPLATE'
  | 'TRANSFORM';

type ParseurBaseParser = {
  account_uuid: string;
  ai_engine: string;
  attachments_only: boolean;
  attachments_only_override: null;
  can_transform: boolean;
  disable_deskew: boolean;
  enable_layouted_text: boolean;
  enable_image_ocr: boolean;
  document_count: number;
  document_per_status_count: {
    INCOMING: number;
    ANALYZING: number;
    PROGRESS: number;
    PARSEDOK: number;
    PARSEDKO: number;
    QUOTAEXC: number;
    SKIPPED: number;
    SPLIT: number;
    DELETED: number;
    EXPORTKO: number;
    TRANSKO: number;
    INVALID: number;
  };
  email_prefix: string;
  even_pages: boolean;
  force_ocr: boolean;
  id: number;
  is_master: boolean;
  last_activity: string;
  name: string;
  odd_pages: boolean;
  page_range_set: string[];
  parser_object_count: number;
  parser_object_set_last_modified: null;
  process_attachments: boolean;
  retention_policy: number;
  template_count: number;
  webhook_count: number;
  attachments_field: boolean;
  original_document_field: boolean;
  searchable_pdf_field: boolean;
  headers_field: boolean;
  received_field: boolean;
  received_date_field: boolean;
  received_time_field: boolean;
  processed_field: boolean;
  processed_date_field: boolean;
  processed_time_field: boolean;
  sender_field: boolean;
  sender_name_field: boolean;
  split_page_range_field: boolean;
  recipient_field: boolean;
  to_field: boolean;
  cc_field: boolean;
  bcc_field: boolean;
  reply_to_field: boolean;
  recipient_suffix_field: boolean;
  original_recipient_field: boolean;
  subject_field: boolean;
  template_field: boolean;
  html_document_field: boolean;
  text_document_field: boolean;
  content_field: boolean;
  last_reply_field: boolean;
  document_id_field: boolean;
  parent_id_field: boolean;
  document_url_field: boolean;
  public_document_url_field: boolean;
  page_count_field: boolean;
  credit_count_field: boolean;
  mailbox_id_field: boolean;
  parsing_engine_field: boolean;
};

type ParseurParser = ParseurBaseParser & {
  split_keywords: null;
  split_page: null;
  split_page_range_set: string[];
  available_webhook_set: string[];
  webhook_set: string[];
  table_set: string[];
};

type ParseurParserDiet = ParseurBaseParser & {
  split_keywords: { keyword: string; is_before: boolean }[] | null;
  split_page: number | null;
  split_page_range_set: { start_index: number; end_index: number }[];
  available_webhook_set: ParseurWebhook[];
  webhook_set: ParseurWebhook[];
  table_set: { id: string; name: string }[];
};

type ParseurDocumentSummary = {
  attached_to: null;
  id: number;
  match_master_template: boolean;
  name: string;
  ocr_ready_url: null;
  original_document_url: string;
  parser: number;
  processed: string;
  received: string;
  sample_set: string[];
  status_source: string;
  status: string;
  template: null;
  credits_used: number;
  conventional_credits_used: number;
  ai_credits_used: number;
  is_ai_ready: boolean;
  is_ocr_ready: boolean;
  is_processable: boolean;
  is_splittable: boolean;
  is_split: boolean;
  json_download_url: string;
  csv_download_url: string;
  xls_download_url: string;
};

type ParseurDocumentDiet = {
  attached_to: number | null;
  id: number;
  name: string;
  match_master_template: boolean;
  ocr_ready_url: string | null;
  original_document_url: string;
  parser: number;
  processed: string;
  received: string;
  sample_set: ParseurTemplateSample[];
  status_source: ParseurDocumentStatusSource;
  status: ParseurDocumentStatus;
  template: number | null;
  credits_used: number;
  conventional_credits_used: number;
  ai_credits_used: number;
  is_ai_ready: boolean;
  is_ocr_ready: boolean;
  is_processable: boolean;
  is_splittable: boolean;
  is_split: boolean;
  json_download_url: string;
  csv_download_url: string;
  xls_download_url: string;
  result: string | null;
};

export type ParseurDocument = {
  attached_to: number | null;
  id: number;
  match_master_template: boolean;
  name: string;
  ocr_ready_url: string | null;
  original_document_url: string;
  parser: number;
  processed: string;
  received: string;
  sample_set: ParseurTemplateSample[];
  status_source: ParseurDocumentStatusSource;
  status: ParseurDocumentStatus;
  template: number | null;
  credits_used: number;
  conventional_credits_used: number;
  ai_credits_used: number;
  is_ai_ready: boolean;
  is_ocr_ready: boolean;
  is_processable: boolean;
  is_splittable: boolean;
  json_download_url: string;
  csv_download_url: string;
  xls_download_url: string;
  result: string | null;
  content: string;
  next_id: number | null;
  previous_id: number | null;
  ocr_page_set: ParseurOcrPage[];
};

export type ParseurListDocumentsResponse = {
  count: number;
  current: number;
  total: number;
  results: (ParseurDocumentDiet | ParseurDocumentSummary)[];
};

export type ParseurListMailboxesResponse = {
  count: number;
  current: number;
  total: number;
  results: (ParseurParserDiet | ParseurParser)[];
};

export type ParseurCreateDocumentResponse = {
  message: string;
};

export type ParseurCreateDocumentFromFileResponse = {
  message: string;
  attachments: { name: string; DocumentID: string }[];
};

export type ParseurNotificationResponse = {
  notification_set: {
    info: string[];
  };
};

export type ParseurListQuery = Record<string, string | undefined>;

export type ParseurRecord = Record<string, unknown>;

export type ParseurPage<T> = {
  count: number;
  current: number;
  total: number;
  results: T[];
};

export type ParseurEmailDocument = {
  subject: string;
  from: string;
  recipient: string;
  to?: string;
  cc?: string;
  bcc?: string;
  body_html?: string;
  body_plain?: string;
  message_headers?: unknown;
};
