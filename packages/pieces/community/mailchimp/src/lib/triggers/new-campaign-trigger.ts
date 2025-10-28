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

const getCampaignEventSummary = (request: MailChimpCampaignWebhookRequest): any => {
  const data = request.data;
  return {
    campaign_id: data.campaign_id,
    campaign_title: data.campaign_title,
    campaign_subject: data.campaign_subject,
    campaign_send_time: data.campaign_send_time,
    campaign_status: data.campaign_status,
    list_id: data.list_id,
    subscriber_id: data.id,
    event_timestamp: request.fired_at,
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

// Note: Campaign webhook data doesn't include performance metrics
// These would need to be fetched separately via the campaigns API if needed

export const mailChimpNewCampaignTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_campaign',
  displayName: 'New Campaign',
  description: 'Fires when a new campaign is created or sent',
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

      if (!request || request.type !== 'campaign') {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'campaign_event',
        event_category: 'Campaign Activity',
        processed_at: new Date().toISOString(),
        campaign_summary: getCampaignEventSummary(request),
        campaign_insights: {
          campaign_type: inferCampaignType(request.data),
          delivery_status: assessDeliveryStatus(request.data),
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing campaign webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
