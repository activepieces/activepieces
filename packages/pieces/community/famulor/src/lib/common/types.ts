export interface Campaign {
  id: number;
  name: string;
  status: string;
  max_calls_in_parallel: number;
  mark_complete_when_no_leads: boolean;
  allowed_hours_start_time: string;
  allowed_hours_end_time: string;
  allowed_days: string[];
  max_retries: number;
  retry_interval: number;
  created_at: string;
  updated_at: string;
}

export interface ListCampaignsResponse {
  campaigns: Campaign[];
}

export interface AddLeadParams {
  auth: string;
  campaign_id: number;
  phone_number: string;
  variables?: Record<string, any>;
  allow_dupplicate?: boolean;
  secondary_contacts?: Array<{
    phone_number: string;
    variables?: Record<string, any>;
  }>;
}

export interface SendSmsParams {
  auth: string;
  from: number;
  to: string;
  bodysuit: string;
}

export interface MakePhoneCallParams {
  auth: string;
  assistant_id: number;
  phone_number: string;
  variable?: {
    customer_name?: string;
    email?: string;
    [key: string]: any;
  };
}

export interface CampaignControlParams {
  auth: string;
  campaign_id: number;
  action: 'start' | 'stop';
}

export interface DeleteLeadParams {
  auth: string;
  lead_id: number;
}

export interface LeadResponse {
  message: string;
  data: {
    id: number;
    campaign_id: number;
    phone_number: string;
    variables?: Record<string, unknown>;
    status: string;
    created_at: string;
    updated_at: string;
    campaign: LeadCampaignSummary;
    secondary_contacts: LeadSecondaryContact[];
  };
}

export interface GetCurrentUserResponse {
  name: string;
  email: string;
  total_balance: number;
}

export interface GenerateAiReplyParams {
  auth: string;
  assistant_id: number;
  customer_identifier: string;
  message: string;
  variables?: Record<string, any>;
}

export interface GenerateAiReplyResponse {
  success: boolean;
  conversation_id?: string;
  customer_identifier: string;
  reply: string;
  function_calls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result: Record<string, any>;
  }>;
  ai_disabled?: boolean;
  error?: string;
  error_code?: string;
}

export interface CreateConversationParams {
  auth: string;
  assistant_id: string;
  type?: 'widget' | 'test';
  variables?: Record<string, any>;
}

export interface CreateConversationResponse {
  status: boolean;
  conversation_id?: string;
  history?: Array<{
    role: string;
    content: string;
  }>;
  error?: string;
}

export interface GetConversationParams {
  auth: string;
  uuid: string;
}

export interface GetConversationResponse {
  status: boolean;
  history?: Array<{
    role: string;
    content: string;
    function_calls?: Array<{
      name: string;
      arguments: Record<string, any>;
      result: Record<string, any>;
    }>;
  }>;
  error?: string;
}

export interface SendMessageParams {
  auth: string;
  uuid: string;
  message: string;
}

export interface SendMessageResponse {
  status: boolean;
  message?: string;
  function_calls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result: Record<string, any>;
  }>;
  error?: string;
}

export interface LeadCampaignSummary {
  id: number;
  name: string;
}

export interface LeadSecondaryContact {
  id: number;
  phone_number: string;
  variables: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LeadListItem {
  id: number;
  campaign_id: number;
  phone_number: string;
  variables: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  campaign: LeadCampaignSummary;
  secondary_contacts: LeadSecondaryContact[];
}

export interface ListLeadsResponse {
  leads: LeadListItem[];
}

export interface UpdateLeadParams {
  auth: string;
  lead_id: number;
  campaign_id?: number;
  phone_number?: string;
  status?: 'created' | 'completed' | 'reached-max-retries';
  variables?: Record<string, unknown>;
}

export interface UpdateLeadResponse {
  message: string;
}

export type CampaignWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface CreateCampaignParams {
  auth: string;
  name: string;
  assistant_id: number;
  timezone?: string;
  max_calls_in_parallel?: number;
  allowed_hours_start_time?: string;
  allowed_hours_end_time?: string;
  allowed_days?: CampaignWeekday[];
  max_retries?: number;
  retry_interval?: number;
  retry_on_voicemail?: boolean;
  retry_on_goal_incomplete?: boolean;
  goal_completion_variable?: string;
  mark_complete_when_no_leads?: boolean;
  phone_number_ids?: number[];
}

export interface CreateCampaignResponse {
  message: string;
  data: Campaign;
}

export type ConversationChannelType = 'test' | 'widget' | 'whatsapp' | 'api';

export interface ConversationSummary {
  id: string;
  assistant_id: string;
  assistant_name: string;
  type: ConversationChannelType;
  variables: Record<string, unknown> | null;
  external_identifier?: string;
  message_count: number;
  total_cost: number;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
  whatsapp_sender?: {
    name: string;
    phone: string;
  };
  customer?: {
    name?: string;
    phone: string;
  };
}

export interface ListConversationsResponse {
  data: ConversationSummary[];
  path?: string;
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
}

export interface ListConversationsParams {
  auth: string;
  type?: ConversationChannelType;
  assistant_id?: number;
  customer_phone?: string;
  whatsapp_sender_phone?: string;
  external_identifier?: string;
  per_page?: number;
  cursor?: string;
}

export type CallStatusFilter =
  | 'initiated'
  | 'ringing'
  | 'busy'
  | 'in-progress'
  | 'ended'
  | 'completed'
  | 'ended_by_customer'
  | 'ended_by_assistant'
  | 'no-answer'
  | 'failed';

export type CallDirectionType = 'inbound' | 'outbound' | 'web';

export interface CallTranscriptSegment {
  text: string;
  type: string;
  sender: string;
  timestamp: number;
}

export interface CallEvaluationRow {
  name: string;
  type: string;
  value: unknown;
  description?: string;
}

export interface CallListItem {
  id: number;
  assistant_name: string;
  campaign_name: string | null;
  type: CallDirectionType;
  duration: number;
  assistant_phone_number: string;
  client_phone_number: string;
  status: string;
  transcript: CallTranscriptSegment[] | string;
  variables: Record<string, unknown>;
  evaluation: CallEvaluationRow[] | Record<string, unknown>;
  webhook_response: Record<string, unknown> | null;
  carrier_cost: number;
  total_cost: number;
  answered_by: string;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListCallsResponse {
  data: CallListItem[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ListCallsParams {
  auth: string;
  status?: CallStatusFilter;
  type?: CallDirectionType;
  phone_number?: string;
  assistant_id?: number;
  campaign_id?: number;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

export interface GetCallParams {
  auth: string;
  call_id: number;
}

export interface GetCallResponse {
  id: number;
  assistant_name: string;
  campaign_name: string | null;
  type: string;
  duration: number;
  assistant_phone_number: string;
  client_phone_number: string;
  status: string;
  transcript: CallTranscriptSegment[] | string;
  variables: Record<string, unknown>;
  evaluation: CallEvaluationRow[] | Record<string, unknown>;
  webhook_response: Record<string, unknown> | null;
  carrier_cost: number;
  total_cost: number;
  answered_by: string;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
}

export type DeleteCallParams = GetCallParams;

export interface DeleteCallResponse {
  message?: string;
}

export interface WhatsAppSender {
  id: number;
  phone_number: string;
  display_name: string;
  status: string;
  quality_rating: string;
  messaging_limit: number | null;
  messaging_limit_formatted: string;
}

export interface GetWhatsAppSendersResponse {
  data: WhatsAppSender[];
}

export interface GetWhatsAppSendersParams {
  auth: string;
  status?: 'online' | 'all';
}

export interface WhatsAppTemplate {
  id: number;
  name: string;
  language: string;
  category: string;
  status: string;
  body_text: string;
  variables: string[];
  has_variables: boolean;
}

export interface GetWhatsAppTemplatesResponse {
  data: WhatsAppTemplate[];
}

export interface GetWhatsAppTemplatesParams {
  auth: string;
  sender_id: number;
  status?: 'approved' | 'all';
}

export interface SendWhatsAppTemplateParams {
  auth: string;
  sender_id: number;
  template_id: number;
  recipient_phone: string;
  recipient_name?: string;
  variables?: Record<string, string>;
}

export interface SendWhatsAppTemplateResponse {
  success: boolean;
  conversation_id?: number;
  message_id?: number;
  whatsapp_message_id?: number;
  message_sid?: string;
  status?: string;
  error?: string;
  error_code?: string;
}

export interface WhatsAppSessionStatus {
  is_open: boolean;
  can_send_freeform: boolean;
  requires_template: boolean;
  message: string;
  minutes_remaining?: number;
  expires_at?: string;
  expired_at?: string;
}

export interface SendWhatsAppFreeformParams {
  auth: string;
  sender_id: number;
  recipient_phone: string;
  message: string;
}

export interface SendWhatsAppFreeformResponse {
  success: boolean;
  conversation_id?: number;
  message_id?: number;
  whatsapp_message_id?: number;
  message_sid?: string;
  session_status?: WhatsAppSessionStatus;
  error?: string;
  error_code?: string;
}

export interface GetWhatsAppSessionStatusParams {
  auth: string;
  sender_id: number;
  recipient_phone: string;
}

export interface GetWhatsAppSessionStatusResponse {
  success: boolean;
  has_conversation: boolean;
  conversation_id?: number;
  customer_name?: string;
  last_customer_message_at?: string;
  session_status: WhatsAppSessionStatus;
  error?: string;
  error_code?: string;
}

export interface AccountPhoneNumber {
  id: number;
  phone_number: string;
  country_code: string;
  type: string;
  type_label: string;
  sms_capable: boolean;
  region: string;
  has_active_subscription: boolean;
  created_at: string;
}

export interface ListAccountPhoneNumbersResponse {
  data: AccountPhoneNumber[];
}

export interface ListAccountPhoneNumbersParams {
  auth: string;
}

export interface AvailablePhoneNumberSearchItem {
  phone_number: string;
  phone_number_formatted: string;
  country_code: string;
  price: number;
  stripe_price_id: string;
  address_requirements: string;
  sms_capable: boolean;
}

export interface SearchAvailablePhoneNumbersResponse {
  data: AvailablePhoneNumberSearchItem[];
}

export interface SearchAvailablePhoneNumbersParams {
  auth: string;
  country_code: string;
  contains?: string;
}

export interface PurchasedPhoneNumberData {
  id: number;
  phone_number: string;
  country_code: string;
  type: string;
  sms_capable: boolean;
}

export interface PurchasePhoneNumberResponse {
  message: string;
  data: PurchasedPhoneNumberData;
}

export interface PurchasePhoneNumberParams {
  auth: string;
  phone_number: string;
}

export interface ConversationEndedTranscriptMessage {
  role: 'assistant' | 'user';
  content: string;
}

export interface ConversationEndedWhatsAppSender {
  phone_number: string;
  display_name: string;
}

export interface ConversationEndedWebhookPayload {
  conversation_id: string;
  assistant_id: string;
  type: 'widget' | 'whatsapp';
  message_count: number;
  status: 'ended';
  extracted_variables: Record<string, unknown>;
  input_variables: Record<string, unknown>;
  transcript: ConversationEndedTranscriptMessage[];
  formatted_transcript: string;
  customer_phone: string | null;
  customer_name: string | null;
  sender: ConversationEndedWhatsAppSender | null;
  created_at: string;
  ended_at: string;
}

export interface AssistantAssignablePhoneNumber {
  id: number;
  phone_number: string;
  country_code: string;
  type_label: string;
  is_available: boolean;
}

export interface ListAssistantPhoneNumbersParams {
  auth: string;
  type?: 'inbound' | 'outbound';
}

export interface AssistantWebhookMutationResponse {
  message: string;
  data: unknown[];
}
