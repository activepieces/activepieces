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
