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

export type MailChimpUnsubscribeWebhookData = {
  id: string;
  list_id: string;
  email: string;
  email_type: MailChimpEmailType;
  reason: string;
  merges: Record<string, string>;
};

export type MailChimpUnsubscribeWebhookRequest = MailChimpWebhookRequest<
  MailChimpWebhookType.UNSUBSCRIBE,
  MailChimpUnsubscribeWebhookData
>;

export type MailChimpCampaignWebhookData = {
  id: string;
  subject: string;
  list_id: string;
  status: string;
  send_time: string;
};

export type MailChimpCampaignWebhookRequest = MailChimpWebhookRequest<
  MailChimpWebhookType.CAMPAIGN,
  MailChimpCampaignWebhookData
>;

export type MailChimpProfileWebhookData = {
  id: string;
  list_id: string;
  email: string;
  email_type: MailChimpEmailType;
  merges: Record<string, string>;
};

export type MailChimpProfileWebhookRequest = MailChimpWebhookRequest<
  MailChimpWebhookType.PROFILE,
  MailChimpProfileWebhookData
>;
