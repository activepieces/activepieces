export const INSTANTLY_WEBHOOK_EVENTS = [
  'all_events',
  'email_sent',
  'email_opened',
  'email_link_clicked',
  'reply_received',
  'auto_reply_received',
  'email_bounced',
  'lead_unsubscribed',
  'campaign_completed',
  'account_error',
  'lead_neutral',
  'lead_interested',
  'lead_not_interested',
  'lead_meeting_booked',
  'lead_meeting_completed',
  'lead_closed',
  'lead_out_of_office',
  'lead_wrong_person',
] as const;

export type InstantlyPaginatedResponse<T> = {
  items: T[];
  next_starting_after?: string;
};

export type InstantlyCampaignScheduleTiming = {
  from: string;
  to: string;
};

export type InstantlyCampaignScheduleEntry = {
  name: string;
  timing: InstantlyCampaignScheduleTiming;
  days: Record<string, boolean>;
  timezone: string;
};

export type InstantlyCampaignSchedule = {
  schedules: InstantlyCampaignScheduleEntry[];
  start_date?: string;
  end_date?: string;
};

export type InstantlyCampaign = {
  id: string;
  name: string;
  status?: number;
  campaign_schedule?: InstantlyCampaignSchedule;
  pl_value?: number;
  is_evergreen?: boolean;
  email_gap?: number;
  random_wait_max?: number;
  text_only?: boolean;
  daily_limit?: number;
  stop_on_reply?: boolean;
  link_tracking?: boolean;
  open_tracking?: boolean;
  stop_on_auto_reply?: boolean;
  daily_max_leads?: number;
  prioritize_new_leads?: boolean;
  match_lead_esp?: boolean;
  stop_for_company?: boolean;
  insert_unsubscribe_header?: boolean;
  allow_risky_contacts?: boolean;
  disable_bounce_protect?: boolean;
  timestamp_created?: string;
  timestamp_updated?: string;
};

export type InstantlyLead = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name?: string;
  phone?: string;
  website?: string;
  campaign?: string;
  list_id?: string;
  status?: number;
  email_open_count?: number;
  email_reply_count?: number;
  email_click_count?: number;
  company_domain?: string;
  payload?: Record<string, unknown>;
  custom_variables?: Record<string, string | number | boolean | null>;
  timestamp_created: string;
  timestamp_updated?: string;
};

export type InstantlyLeadList = {
  id: string;
  name: string;
  has_enrichment_task?: boolean;
};

export type InstantlyWebhook = {
  id: string;
  event_type: string | null;
  target_hook_url: string;
  campaign?: string | null;
  status?: string;
  organization?: string;
  name?: string;
  headers?: Record<string, string>;
  timestamp_created?: string;
};

export type InstantlyBackgroundJob = {
  id: string;
  status: string;
};

export type InstantlyCampaignAnalytics = {
  campaign_id?: string;
  campaign_name?: string;
  total_leads?: number;
  leads_contacted?: number;
  emails_sent?: number;
  emails_read?: number;
  replies?: number;
  bounced?: number;
  unsubscribed?: number;
  new_leads_contacted?: number;
  total_opportunities?: number;
};

export type InstantlyWebhookPayload = {
  timestamp: string;
  event_type: string;
  workspace: string;
  campaign_id: string;
  campaign_name: string;
  lead_email?: string;
  email_account?: string;
  unibox_url?: string;
  step?: number;
  variant?: string;
  is_first?: boolean;
  email_id?: string;
  email_subject?: string;
  email_text?: string;
  email_html?: string;
  reply_text_snippet?: string;
  reply_subject?: string;
  reply_text?: string;
  reply_html?: string;
};

export type InstantlyWebhookEventType = typeof INSTANTLY_WEBHOOK_EVENTS[number];
