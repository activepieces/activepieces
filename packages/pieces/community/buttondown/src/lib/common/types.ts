export type ButtondownSubscriberType =
  | 'blocked'
  | 'complained'
  | 'churning'
  | 'churned'
  | 'gifted'
  | 'unactivated'
  | 'unpaid'
  | 'undeliverable'
  | 'premium'
  | 'past_due'
  | 'paused'
  | 'regular'
  | 'removed'
  | 'trialed'
  | 'unsubscribed'
  | 'upcoming';

export type ButtondownSubscriberSource =
  | 'admin'
  | 'api'
  | 'carrd'
  | 'comment'
  | 'embedded_form'
  | 'form'
  | 'import'
  | 'memberful'
  | 'organic'
  | 'patreon'
  | 'stripe'
  | 'user'
  | 'zapier';

export interface ButtondownSubscriber {
  id: string;
  creation_date: string;
  email_address: string;
  type: ButtondownSubscriberType;
  tags: string[];
  metadata: Record<string, unknown>;
  notes?: string;
  referrer_url?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_source?: string;
  ip_address?: string;
  source: ButtondownSubscriberSource;
  last_open_date?: string | null;
  last_click_date?: string | null;
  click_rate?: number | null;
  open_rate?: number | null;
  churn_date?: string | null;
  unsubscription_date?: string | null;
  undeliverability_date?: string | null;
  [key: string]: unknown;
}

export interface ButtondownSubscriberInput {
  email_address: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  referrer_url?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_source?: string;
  referring_subscriber_id?: string;
  type?: ButtondownSubscriberType;
  ip_address?: string;
}

export type ButtondownEmailType =
  | 'public'
  | 'private'
  | 'premium'
  | 'free'
  | 'churned'
  | 'archival';

export type ButtondownEmailStatus =
  | 'draft'
  | 'managed_by_rss'
  | 'about_to_send'
  | 'scheduled'
  | 'in_flight'
  | 'paused'
  | 'deleted'
  | 'errored'
  | 'sent'
  | 'imported'
  | 'throttled'
  | 'resending'
  | 'transactional'
  | 'suppressed';

export interface ButtondownEmail {
  id: string;
  creation_date: string;
  modification_date: string;
  subject: string;
  body: string;
  status: ButtondownEmailStatus;
  email_type: ButtondownEmailType;
  publish_date?: string | null;
  description?: string;
  canonical_url?: string;
  image?: string;
  metadata?: Record<string, unknown>;
  attachments?: string[];
  [key: string]: unknown;
}

export interface ButtondownEmailInput {
  subject: string;
  body?: string;
  status?: ButtondownEmailStatus;
  email_type?: ButtondownEmailType;
  publish_date?: string;
  description?: string;
  canonical_url?: string;
  image?: string;
  metadata?: Record<string, unknown>;
  slug?: string;
  attachments?: string[];
  should_trigger_pay_per_email_billing?: boolean;
}

export type ButtondownWebhookEvent =
  | 'subscriber.created'
  | 'subscriber.confirmed'
  | 'email.sent';

export interface ButtondownWebhook {
  id: string;
  creation_date: string;
  url: string;
  event_types: ButtondownWebhookEvent[];
  status?: 'enabled' | 'disabled';
  description?: string;
  signing_key?: string;
}

export interface ButtondownWebhookInput {
  url: string;
  event_types: ButtondownWebhookEvent[];
  description?: string;
  signing_key?: string;
  status?: 'enabled' | 'disabled';
}
