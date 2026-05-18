import { HttpMessageBody } from '@activepieces/pieces-common';

export interface EventBody extends HttpMessageBody {
  api_key?: string;
  timestamp?: string;
  category?: string;
  distinct_id?: string;
  context?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  type: string;
  event: string;
  name?: string;
  messageId?: string;
}

export interface EventCaptureResponse {
  status?: number;
  type?: string;
  code?: string;
  detail?: string;
  attr?: string;
}

export interface ProjectCreateRequest {
  name?: string;
  api_key?: string;
  project_id?: string;
  slack_incoming_webhook?: string;
  anonymize_ips?: boolean;
  is_demo?: boolean;
}

export interface ProjectCreateResponse {
  id: 0;
  uuid: string;
  organization: string;
  api_token: string;
  app_urls: string[];
  name: string;
  slack_incoming_webhook: string;
  created_at: string;
  updated_at: string;
  anonymize_ips: boolean;
  completed_snippet_onboarding: boolean;
  ingested_event: boolean;
  test_account_filters: Record<string, never>;
  test_account_filters_default_checked: boolean;
  path_cleaning_filters: Record<string, never>;
  is_demo: boolean;
  timezone: string;
  data_attributes: Record<string, never>;
  person_display_name_properties: string[];
  correlation_config: Record<string, never>;
  session_recording_opt_in: boolean;
  capture_console_log_opt_in: boolean;
  capture_performance_opt_in: boolean;
  effective_membership_level: number;
  access_control: boolean;
  has_group_types: boolean;
  primary_dashboard: number;
  live_events_columns: string[];
  recording_domains: string[];
  person_on_events_querying_enabled: boolean;
  groups_on_events_querying_enabled: boolean;
  inject_web_apps: boolean;
}
