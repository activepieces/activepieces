export interface ZendeskAuthProps {
  email: string;
  token: string;
  subdomain: string;
}

export interface ZendeskTicket {
  id: number;
  url: string;
  external_id?: string;
  type?: string;
  subject?: string;
  raw_subject?: string;
  description?: string;
  priority?: string;
  status: string;
  recipient?: string;
  requester_id: number;
  submitter_id: number;
  assignee_id?: number;
  organization_id?: number;
  group_id?: number;
  collaborator_ids: number[];
  follower_ids: number[];
  email_cc_ids: number[];
  forum_topic_id?: number;
  problem_id?: number;
  has_incidents: boolean;
  is_public: boolean;
  due_at?: string;
  tags: string[];
  custom_fields: any[];
  satisfaction_rating?: any;
  sharing_agreement_ids: number[];
  custom_status_id?: number;
  fields: any[];
  followup_ids: number[];
  ticket_form_id?: number;
  brand_id: number;
  allow_channelback: boolean;
  allow_attachments: boolean;
  from_messaging_channel: boolean;
  via: {
    channel: string;
    source: any;
  };
  created_at: string;
  updated_at: string;
}

export interface ZendeskUser {
  id: number;
  url: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  time_zone?: string;
  iana_time_zone?: string;
  phone?: string;
  shared_phone_number?: string;
  photo?: {
    id: number;
    name: string;
    content_url: string;
    mapped_content_url: string;
    content_type: string;
    size: number;
    width: number;
    height: number;
  };
  locale_id?: number;
  locale?: string;
  organization_id?: number;
  role: string;
  verified: boolean;
  external_id?: string;
  tags: string[];
  alias?: string;
  active: boolean;
  shared: boolean;
  shared_agent: boolean;
  last_login_at?: string;
  two_factor_auth_enabled?: boolean;
  signature?: string;
  details?: string;
  notes?: string;
  role_type?: number;
  custom_role_id?: number;
  moderator: boolean;
  ticket_restriction?: string;
  only_private_comments: boolean;
  restricted_agent: boolean;
  suspended: boolean;
  default_group_id?: number;
  report_csv: boolean;
  user_fields: Record<string, any>;
}

export interface ZendeskOrganization {
  id: number;
  url: string;
  external_id?: string;
  name: string;
  created_at: string;
  updated_at: string;
  domain_names: string[];
  details?: string;
  notes?: string;
  group_id?: number;
  shared_tickets: boolean;
  shared_comments: boolean;
  tags: string[];
  organization_fields: Record<string, any>;
}

export interface ZendeskComment {
  id: number;
  type: string;
  author_id: number;
  body: string;
  html_body: string;
  plain_body: string;
  public: boolean;
  attachments: any[];
  audit_id: number;
  via: {
    channel: string;
    source: any;
  };
  created_at: string;
  metadata: any;
}

export interface ZendeskView {
  id: number;
  title: string;
  active: boolean;
  position: number;
  restriction?: {
    type: string;
    id?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ZendeskTicketForm {
  id: number;
  name: string;
  raw_name: string;
  display_name: string;
  raw_display_name: string;
  end_user_visible: boolean;
  position: number;
  ticket_field_ids: number[];
  active: boolean;
  default: boolean;
  created_at: string;
  updated_at: string;
  in_all_brands: boolean;
  restricted_brand_ids: number[];
}

export interface ZendeskGroup {
  id: number;
  name: string;
  description?: string;
  default: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ZendeskAuditEvent {
  id: number;
  ticket_id: number;
  timestamp: number;
  created_at: string;
  author_id: number;
  metadata: any;
  via: {
    channel: string;
    source: any;
  };
  events: Array<{
    id: number;
    type: string;
    author_id: number;
    body?: string;
    html_body?: string;
    plain_body?: string;
    public?: boolean;
    attachments?: any[];
    audit_id?: number;
    via?: any;
    field_name?: string;
    value?: any;
    previous_value?: any;
  }>;
}