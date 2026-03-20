import { ApFile } from '@activepieces/pieces-framework';

// Common Types
export interface AuthenticationParams {
  apiKey: string;
}

type TemplateSample = {
  template_id: number;
  name: string;
  sample_count: number;
};

type OcrPage = {
  image: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
  position: number;
  included_in_range: boolean;
};

type Webhook = {
  id: number;
  event:
    | 'document.processed'
    | 'document.processed.flattened'
    | 'document.template_needed'
    | 'document.export_failed'
    | 'table.processed';
  target: string;
  name: string;
  headers: Record<string, string>;
  category: 'CUSTOM' | 'ZAPIER' | 'MAKE' | 'FLOW' | 'N8N';
  parser_field_set: string[];
};

interface BaseParser {
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
}

interface Parser extends BaseParser {
  split_keywords: null;
  split_page: null;
  split_page_range_set: string[];
  available_webhook_set: string[];
  webhook_set: string[];
  table_set: string[];
}

interface ParserDiet extends BaseParser {
  split_keywords: { keyword: string; is_before: boolean }[] | null;
  split_page: number | null;
  split_page_range_set: { start_index: number; end_index: number }[];
  template_count: number;
  webhook_count: number;
  attachments_field: boolean;
  original_document_field: boolean;
  available_webhook_set: Webhook[];
  webhook_set: Webhook[];
  table_set: { id: string; name: string }[];
}

interface Document {
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
}

interface DocumentDiet {
  attached_to: number | null;
  id: number;
  name: string;
  match_master_template: boolean;
  ocr_ready_url: string | null;
  original_document_url: string;
  parser: number;
  processed: string;
  received: string;
  sample_set: TemplateSample[];
  status_source: 'AI' | 'AUTO' | 'CSV' | 'METADATA' | 'TEMPLATE' | 'TRANSFORM';
  status:
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
}

export interface WebhookInformation {
  webhookId: number;
}
// API Types
export interface ListDocumentsParams extends AuthenticationParams {
  parserId: number;
  page?: number;
  page_size?: number;
  search?: string;
  ordering?:
    | 'name'
    | '-name'
    | 'created'
    | '-created'
    | 'processed'
    | '-processed'
    | 'status'
    | '-status';
  received_after?: string; // yyyy-mm-dd
  received_before?: string; // yyyy-mm-dd
  tz?: string; // Example: "Asia/Singapore"
  with_result?: boolean;
}

export interface ListDocumentsResponse {
  count: number;
  current: number;
  total: number;
  results: (DocumentDiet | Document)[];
}

export interface GetParsedDocumentByIdParams extends AuthenticationParams {
  documentId: string;
}

export interface GetParsedDocumentByIdResponse {
  attached_to: number | null;
  id: number;
  match_master_template: boolean;
  name: string;
  ocr_ready_url: string | null;
  original_document_url: string;
  parser: number;
  processed: string;
  received: string;
  sample_set: TemplateSample[];
  status_source: 'AI' | 'AUTO' | 'CSV' | 'METADATA' | 'TEMPLATE' | 'TRANSFORM';
  status:
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
  ocr_page_set: OcrPage[];
}

export interface CreateDocumentParams extends AuthenticationParams {
  subject: string;
  from: string;
  recipient: string;
  to?: string;
  cc?: string;
  bcc?: string;
  body_html?: string;
  body_plain?: string;
  message_headers?: Record<string, string>;
}

export interface CreateDocumentResponse {
  message: string;
}

export interface CreateDocumentFromFileParams extends AuthenticationParams {
  parserId: number;
  file: ApFile;
}

export interface CreateDocumentFromFileResponse {
  message: string;
  attachments: { name: string; DocumentID: string }[];
}

export interface ReprocessDocumentParams extends AuthenticationParams {
  documentId: string;
}

export interface ReprocessDocumentResponse {
  notification_set: {
    info: string[];
  };
}

export interface ListMailboxesParams extends AuthenticationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?:
    | 'name'
    | '-name'
    | 'document_count'
    | '-document_count'
    | 'template_count'
    | '-template_count'
    | 'PARSEDOK_count'
    | '-PARSEDOK_count'
    | 'PARSEDKO_count'
    | '-PARSEDKO_count'
    | 'QUOTAEXC_count'
    | '-QUOTAEXC_count'
    | 'EXPORTKO_count'
    | '-EXPORTKO_count'
    | 'TRANSKO_count'
    | '-TRANSKO_count';
}

export interface ListMailboxesResponse {
  count: number;
  current: number;
  total: number;
  results: (ParserDiet | Parser)[];
}

export interface CreateWebhookParams extends AuthenticationParams {
  event:
    | 'document.processed'
    | 'document.processed.flattened'
    | 'document.template_needed'
    | 'document.export_failed'
    | 'table.processed';
  target: string;
  name?: string;
  headers?: Record<string, string>;
  category: 'CUSTOM' | 'ZAPIER' | 'MAKE' | 'FLOW' | 'N8N';
  parser_field_set?: string[];
}

export interface CreateWebhookResponse {
  id: number;
  event:
    | 'document.processed'
    | 'document.processed.flattened'
    | 'document.template_needed'
    | 'document.export_failed'
    | 'table.processed';
  target: string;
  name: string;
  headers: Record<string, string>;
  category: 'CUSTOM' | 'ZAPIER' | 'MAKE' | 'FLOW' | 'N8N';
  parser_field_set: string[];
}

export interface EnableWebhookParams extends AuthenticationParams {
  webhookId: number;
  mailboxId: number;
}

export interface DeleteWebhookParams extends AuthenticationParams {
  webhookId: number;
};


