export enum MailChimpWebhookType {
  /**
   * triggers when a list subscriber is added.
   */
  SUBSCRIBE = 'subscribe',

  /**
   * triggers when a list member unsubscribes.
   */
  UNSUBSCRIBE = 'unsubscribe',

  /**
   * triggers when a subscriber's profile is updated.
   */
  PROFILE = 'profile',

  /**
   * triggers when a subscriber's email address is cleaned from the list.
   */
  CLEANED = 'cleaned',

  /**
   * triggers when a subscriber's email address is changed.
   */
  UP_EMAIL = 'upemail',

  /**
   * triggers when a campaign is sent or cancelled.
   */
  CAMPAIGN = 'campaign',

  /**
   * triggers when a subscriber's email address is changed.
   */
  PENDING = 'pending',

  /**
   * transactional
   */
  TRANSACTIONAL = 'transactional',

  /**
   * triggers when a subscriber clicks a link in a campaign.
   */
  CLICK = 'click',

  /**
   * triggers when a subscriber opens an email in a campaign.
   */
  OPEN = 'open',
}

export enum MailChimpEmailType {
  HTML = 'html',
  TEXT = 'text',
}

export type MailChimpWebhookRequest<Type extends MailChimpWebhookType, Data> = {
  type: Type;
  fired_at: string;
  data: Data;
};

export type MailChimpSubscribeWebhookData = {
  id: string;
  list_id: string;
  email: string;
  email_type: MailChimpEmailType;
  ip_opt: string;
  ip_signup: string;
  merges: Record<string, string>;
};

export type MailChimpSubscribeWebhookRequest = MailChimpWebhookRequest<
  MailChimpWebhookType.SUBSCRIBE,
  MailChimpSubscribeWebhookData
>;

export type MailChimpClickWebhookData = {
  id: string;
  list_id: string;
  campaign_id: string;
  email: string;
  url: string;
  ip: string;
  user_agent: string;
  timestamp?: string;
  link_id?: string;
  click_count?: number;
  is_first_click?: boolean;
};

export type MailChimpClickWebhookRequest = MailChimpWebhookRequest<
  MailChimpWebhookType.CLICK,
  MailChimpClickWebhookData
>;

export type MailChimpOpenWebhookData = {
  id: string;
  list_id: string;
  campaign_id: string;
  email: string;
  ip: string;
  user_agent: string;
  timestamp: string;
};

export type MailChimpOpenWebhookRequest = MailChimpWebhookRequest<
  MailChimpWebhookType.OPEN,
  MailChimpOpenWebhookData
>;

export type MailChimpCampaignWebhookData = {
  id: string;
  list_id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_subject: string;
  campaign_send_time: string;
  campaign_status: string;
};

export type MailChimpCampaignWebhookRequest = MailChimpWebhookRequest<
  MailChimpWebhookType.CAMPAIGN,
  MailChimpCampaignWebhookData
>;

// Extended Mailchimp API types since the official @types/mailchimp__mailchimp_marketing package is incomplete

export interface MailchimpClient {
  setConfig(config: MailchimpConfig): void;
  campaigns: MailchimpCampaignsApi;
  lists: MailchimpListsApi;
  reports: MailchimpReportsApi;
  searchCampaigns: MailchimpSearchCampaignsApi;
  ecommerce: MailchimpEcommerceApi;
}

export interface MailchimpSearchCampaignsApi {
  search(params: any): Promise<any>;
}

export interface MailchimpEcommerceApi {
  getAllStoreCustomers(storeId: string, opts?: any): Promise<any>;
  stores(opts?: any): Promise<any>;
}

export interface MailchimpConfig {
  accessToken: string;
  server: string;
}

export interface MailchimpCampaignsApi {
  create(data: CampaignCreateData): Promise<Campaign>;
  get(campaignId: string, opts?: CampaignGetOptions): Promise<Campaign>;
  update(campaignId: string, data: Partial<CampaignCreateData>): Promise<Campaign>;
  remove(campaignId: string): Promise<void>;
  send(campaignId: string): Promise<void>;
  setContent(campaignId: string, content: CampaignContentData): Promise<any>;
  list(opts?: any): Promise<any>;
}

export interface MailchimpListsApi {
  createList(data: any): Promise<any>;
  deleteListMember(listId: string, subscriberHash: string): Promise<void>;
  addListMember(listId: string, data: any): Promise<any>;
  updateListMember(listId: string, subscriberHash: string, data: any): Promise<any>;
  setListMember(listId: string, subscriberHash: string, data: any, opts?: any): Promise<any>;
  batchListMembers(listId: string, data: any, opts?: any): Promise<any>;
  getAllLists(options?: any): Promise<any>;
  tagSearch(listId: string, opts?: any): Promise<any>;
  updateListMemberTags(listId: string, subscriberHash: string, data: any): Promise<any>;
}

export interface MailchimpReportsApi {
  getCampaignReport(campaignId: string, opts?: CampaignReportOptions): Promise<CampaignReport>;
  getAllCampaignReports(opts?: any): Promise<any>;
}

export interface CampaignCreateData {
  type: string;
  recipients: {
    list_id: string;
  };
  settings: {
    subject_line: string;
    title: string;
    from_name: string;
    from_email: string;
    reply_to: string;
    to_name?: string;
  };
}

export interface CampaignContentData {
  html?: string;
  plain_text?: string;
  url?: string;
  template?: {
    id: string;
    sections?: Record<string, any>;
  };
}

export interface CampaignGetOptions {
  fields?: string;
  exclude_fields?: string;
}

export interface CampaignReportOptions {
  fields?: string;
  exclude_fields?: string;
}

export interface CampaignReport {
  id: string;
  campaign_title: string;
  type: string;
  list_id: string;
  list_is_active: boolean;
  list_name: string;
  subject_line: string;
  preview_text?: string;
  emails_sent: number;
  abuse_reports: number;
  unsubscribed: number;
  send_time?: string;
  rss_last_send?: string;
  bounces?: {
    hard_bounces: number;
    soft_bounces: number;
    syntax_errors: number;
  };
  forwards?: {
    forwards_count: number;
    forwards_opens: number;
  };
  opens?: {
    opens_total: number;
    unique_opens: number;
    open_rate: number;
    last_open?: string;
    proxy_excluded_opens?: number;
    proxy_excluded_unique_opens?: number;
    proxy_excluded_open_rate?: number;
  };
  clicks?: {
    clicks_total: number;
    unique_clicks: number;
    unique_subscriber_clicks: number;
    click_rate: number;
    last_click?: string;
  };
  facebook_likes?: {
    recipient_likes: number;
    unique_likes: number;
    facebook_likes: number;
  };
  industry_stats?: {
    type: string;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
    unopen_rate: number;
    unsub_rate: number;
    abuse_rate: number;
  };
  list_stats?: {
    sub_rate: number;
    unsub_rate: number;
    open_rate: number;
    proxy_excluded_open_rate: number;
    click_rate: number;
  };
  ab_split?: {
    a?: {
      bounces: number;
      abuse_reports: number;
      unsubs: number;
      recipient_clicks: number;
      forwards: number;
      forwards_opens: number;
      opens: number;
      last_open?: string;
      unique_opens: number;
    };
    b?: {
      bounces: number;
      abuse_reports: number;
      unsubs: number;
      recipient_clicks: number;
      forwards: number;
      forwards_opens: number;
      opens: number;
      last_open?: string;
      unique_opens: number;
    };
  };
  timewarp?: Array<{
    gmt_offset: number;
    opens: number;
    last_open?: string;
    unique_opens: number;
    clicks: number;
    last_click?: string;
    unique_clicks: number;
    bounces: number;
  }>;
  timeseries?: Array<{
    timestamp: string;
    emails_sent: number;
    unique_opens: number;
    proxy_excluded_unique_opens: number;
    recipients_clicks: number;
  }>;
  share_report?: {
    share_url: string;
    share_password: string;
  };
  ecommerce?: {
    total_orders: number;
    total_spent: number;
    total_revenue: number;
    currency_code: string;
  };
  delivery_status?: {
    enabled: boolean;
    can_cancel: boolean;
    status: string;
    emails_sent: number;
    emails_canceled: number;
  };
  _links?: Array<{
    rel: string;
    href: string;
    method: string;
  }>;
}

export interface Campaign {
  id: string;
  web_id: number;
  parent_campaign_id?: string;
  type: string;
  create_time: string;
  archive_url: string;
  long_archive_url?: string;
  status: string;
  emails_sent: number;
  send_time?: string;
  content_type: string;
  needs_block_refresh?: boolean;
  resendable?: boolean;
  recipients: {
    list_id: string;
    list_is_active: boolean;
    list_name: string;
    segment_text: string;
    recipient_count: number;
  };
  settings: {
    subject_line: string;
    title: string;
    from_name: string;
    reply_to: string;
    to_name: string;
    content_type: string;
    content_url?: string;
    template_id?: number;
  };
  variate_settings?: any;
  tracking?: any;
  rss_opts?: any;
  ab_split_opts?: any;
  social_card?: any;
  report_summary?: any;
  delivery_status?: any;
  resend_shortcut_eligibility?: any;
  resend_shortcut_usage?: any;
  _links: Array<{
    rel: string;
    href: string;
    method: string;
    targetSchema?: string;
    schema?: string;
  }>;
}
