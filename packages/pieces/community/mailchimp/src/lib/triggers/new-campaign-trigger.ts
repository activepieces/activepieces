import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { MailChimpCampaignWebhookRequest } from '../common/types';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_campaign_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

const getCampaignEventSummary = (request: any): any => {
  const data = request.data || {};
  return {
    campaign_id: data.campaign_id || 'N/A',
    campaign_title: data.campaign_title || 'N/A',
    campaign_subject: data.campaign_subject || 'N/A',
    campaign_send_time: data.campaign_send_time || 'N/A',
    campaign_status: data.campaign_status || 'N/A',
    list_id: data.list_id || 'N/A',
    subscriber_id: data.id || 'N/A',
    email: data.email || 'N/A',
    event_timestamp: request.fired_at || 'N/A',
    campaign_type: inferCampaignType(data),
    delivery_status: assessDeliveryStatus(data),
  };
};

const inferCampaignType = (data: any): string => {
  if (data.campaign_title?.toLowerCase().includes('welcome')) return 'Welcome Series';
  if (data.campaign_title?.toLowerCase().includes('newsletter')) return 'Newsletter';
  if (data.campaign_title?.toLowerCase().includes('promo')) return 'Promotional';
  if (data.campaign_title?.toLowerCase().includes('abandoned')) return 'Abandoned Cart';
  return 'Standard Campaign';
};

const assessDeliveryStatus = (data: any): string => {
  const status = data.campaign_status || '';
  if (status === 'sent') return 'Delivered';
  if (status === 'sending') return 'In Progress';
  if (status === 'scheduled') return 'Scheduled';
  if (status === 'paused') return 'Paused';
  if (status === 'canceled') return 'Canceled';
  return 'Unknown';
};

const extractPerformanceMetrics = (data: any): any => {
  return {
    emails_sent: data.emails_sent || 0,
    emails_delivered: data.emails_delivered || 0,
    emails_opened: data.emails_opened || 0,
    emails_clicked: data.emails_clicked || 0,
    open_rate: data.open_rate || 0,
    click_rate: data.click_rate || 0,
    delivery_rate: data.emails_delivered && data.emails_sent ? 
      (data.emails_delivered / data.emails_sent) : 0,
    engagement_rate: data.emails_opened && data.emails_delivered ? 
      (data.emails_opened / data.emails_delivered) : 0,
  };
};

export const mailChimpNewCampaignTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_campaign',
  displayName: 'New Campaign',
  description: 'Fires when a new campaign is created, sent, or updated in your Mailchimp account. This trigger captures campaign lifecycle events including creation, sending, and delivery status changes.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'campaign',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: '8a25ff1d98',
      list_id: 'a6b5da1054',
      campaign_id: 'campaign_123',
      campaign_title: 'Welcome Campaign',
      campaign_subject: 'Welcome to our newsletter',
      campaign_send_time: '2024-01-15T10:30:00Z',
      campaign_status: 'sent',
      campaign_type: 'regular',
      emails_sent: 1500,
      emails_delivered: 1480,
      emails_opened: 740,
      emails_clicked: 222,
      open_rate: 0.493,
      click_rate: 0.148,
      campaign_recipients: 1500,
      campaign_archive_url: 'https://example.com/archive',
      campaign_web_id: 12345,
    },
  },

  async onEnable(context): Promise<void> {
    try {
      const accessToken = getAccessTokenOrThrow(context.auth);
      const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

      const enabledWebhookId = await mailchimpCommon.enableWebhookRequest({
        server,
        listId: context.propsValue.list_id as string,
        token: accessToken,
        webhookUrl: context.webhookUrl!,
        events: { 
          campaign: true,
          profile: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        listId: context.propsValue.list_id as string,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable campaign webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async onDisable(context): Promise<void> {
    try {
      const webhookData = await context.store?.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);

      if (webhookData === undefined || webhookData === null) {
        return;
      }

      const token = getAccessTokenOrThrow(context.auth);
      const server = await mailchimpCommon.getMailChimpServerPrefix(token);

      await mailchimpCommon.disableWebhookRequest({
        server,
        token,
        listId: webhookData.listId,
        webhookId: webhookData.id,
      });
    } catch (error: any) {
      console.error(`Failed to disable campaign webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as MailChimpCampaignWebhookRequest;

      if (request === undefined || request.type !== 'campaign') {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'campaign_event',
        event_category: 'Campaign Activity',
        processed_at: new Date().toISOString(),
        campaign_summary: getCampaignEventSummary(request),
        business_context: {
          campaign_management: true,
          marketing_automation: true,
          performance_tracking: true,
          audience_engagement: true,
        },
        campaign_insights: {
          campaign_type: inferCampaignType(request.data),
          delivery_status: assessDeliveryStatus(request.data),
          performance_metrics: extractPerformanceMetrics(request.data),
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing campaign webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
