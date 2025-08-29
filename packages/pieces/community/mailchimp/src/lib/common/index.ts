import { Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';

export const mailchimpCommon = {
  mailChimpListIdDropdown: Property.Dropdown({
    displayName: 'Audience ID',
    description: 'The unique ID of the Mailchimp audience/list',
    required: true,
    options: {
      disabled: true,
      options: [],
    },
  }),

  async getMailChimpServerPrefix(accessToken: string): Promise<string> {
    try {
      const response = await fetch('https://login.mailchimp.com/oauth2/metadata', {
        headers: {
          'Authorization': `OAuth ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get server prefix: ${response.statusText}`);
      }

      const data = await response.json();
      return data.dc;
    } catch (error) {
      console.error('Error getting Mailchimp server prefix:', error);
      throw new Error('Failed to get Mailchimp server prefix');
    }
  },

  getMD5EmailHash(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  },

  async enableWebhookRequest({
    server,
    listId,
    token,
    webhookUrl,
    events,
  }: {
    server: string;
    listId: string;
    token: string;
    webhookUrl: string;
    events: Record<string, boolean>;
  }): Promise<string> {
    try {
      const response = await fetch(
        `https://${server}.api.mailchimp.com/3.0/lists/${listId}/webhooks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: webhookUrl,
            events,
            sources: {
              user: true,
              admin: true,
              api: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to enable webhook: ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error: any) {
      console.error('Error enabling webhook:', error);
      throw new Error(`Failed to enable webhook: ${error.message}`);
    }
  },

  async disableWebhookRequest({
    server,
    token,
    listId,
    webhookId,
  }: {
    server: string;
    token: string;
    listId: string;
    webhookId: string;
  }): Promise<void> {
    try {
      const response = await fetch(
        `https://${server}.api.mailchimp.com/3.0/lists/${listId}/webhooks/${webhookId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to disable webhook: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error disabling webhook:', error);
    }
  },
};

export type MailChimpWebhookRequest = {
  type: string;
  fired_at: string;
  data: any;
};

export type MailChimpCampaignWebhookRequest = {
  type: 'campaign';
  fired_at: string;
  data: {
    campaign_id: string;
    campaign_title: string;
    campaign_subject: string;
    campaign_send_time: string;
    campaign_status: string;
    campaign_type: string;
    emails_sent: number;
    emails_delivered: number;
    emails_opened: number;
    emails_clicked: number;
    open_rate: number;
    click_rate: number;
    campaign_recipients: number;
    campaign_archive_url: string;
    campaign_web_id: number;
  };
};

export type MailChimpClickWebhookRequest = {
  type: 'click';
  fired_at: string;
  data: {
    id: string;
    list_id: string;
    campaign_id: string;
    email: string;
    url: string;
    ip: string;
    user_agent: string;
  };
};

export type MailChimpOpenWebhookRequest = {
  type: 'open';
  fired_at: string;
  data: {
    id: string;
    list_id: string;
    campaign_id: string;
    email: string;
    ip: string;
    user_agent: string;
  };
};
