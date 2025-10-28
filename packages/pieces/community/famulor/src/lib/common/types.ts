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
  variable?: Record<string, any>;
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
    id: string;
  };
}
