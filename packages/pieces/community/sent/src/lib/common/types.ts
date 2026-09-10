export type SentEnvelope<T> = {
  success: boolean;
  data?: T | null;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]> | null;
    doc_url?: string | null;
  } | null;
  meta?: { request_id: string; timestamp: string; version: string };
};

export type Account = {
  type: string;
  id: string;
  name: string;
  email?: string | null;
};
export type Pagination = {
  page: number;
  page_size: number;
  has_more: boolean;
  total_pages: number;
  total_count: number;
};
export type ProfileList = {
  sender_profiles: { id: string; name: string }[];
  pagination: Pagination;
};
export type Template = {
  id: string;
  name: string;
  variables?: string[] | null;
  language: string;
  status: string;
  is_published: boolean;
};
export type TemplateList = { templates: Template[]; pagination: Pagination };
export type EventType = {
  name: string;
  display_name: string;
  description?: string | null;
  is_active: boolean;
  event_type?: string | null;
  sub_types?: EventType[] | null;
};
export type EventTypes = { event_types: EventType[] };
export type Subscription = {
  event_types: string[];
  event_filters?: Record<string, string[]>;
};
export type Webhook = Subscription & {
  id: string;
  endpoint_url: string;
  display_name: string;
  is_active: boolean;
  signing_secret?: string | null;
};
export type WebhookList = { webhooks: Webhook[]; pagination: Pagination };
export type WebhookRequest = Subscription & {
  endpoint_url: string;
  display_name: string;
  retry_count: number;
  timeout_seconds: number;
};
export type SendMessageRequest = {
  to: string[];
  channel?: string[];
  text?: string;
  template?: {
    id?: string;
    name?: string;
    parameters?: Record<string, string>;
  };
  sandbox: boolean;
};
