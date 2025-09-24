export interface Profile {
  profile_id: number;
  profile_name: string;
}

export interface ProfilesResponse {
  profiles: Profile[];
}

export interface CreateLeadParams {
  profile_id: number;
  lead_type: string;
  referring_source?: string;
  referring_medium?: string;
  send_notification?: boolean;
  contact_name?: string;
  email_address?: string;
  phone_number?: string;
  company_name?: string;
  notes?: string;
}

export interface FindLeadParams {
  profile_id?: number;
  email_address?: string;
  phone_number?: string;
  lead_type?: string;
  per_page?: number;
  from_date?: string;
  to_date?: string;
  page_number?: number;
}

export interface CreateExportParams {
  profile_id: number;
  from_date: string;
  to_date: string;
  export_type?: string;
}

export interface UpdateLeadParams {
  lead_type?: string;
  quotable?: 'Yes' | 'No';
  sales_value?: string;
  referring_source?: string;
  referring_medium?: string;
  referring_campaign?: string;
  lead_details?: { [key: string]: unknown };
}

export interface LeadDetail {
  label: string;
  value: string;
}

export interface Lead {
  lead_id: number;
  lead_type: string;
  lead_details: LeadDetail[];
}

export interface LeadsResponse {
  leads: Lead[];
  total_pages: number;
}

export interface Account {
  account_id: number;
  account_name: string;
}

export interface AccountsResponse {
  accounts: Account[];
}
