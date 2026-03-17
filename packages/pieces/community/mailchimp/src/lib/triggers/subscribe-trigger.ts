import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { MailChimpSubscribeWebhookRequest } from '../common/types';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_subscribe_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

const getSubscribeEventSummary = (request: any): any => {
  const data = request.data || {};
  return {
    email: data.email || 'N/A',
    subscriber_id: data.id || 'N/A',
    list_id: data.list_id || 'N/A',
    email_type: data.email_type || 'html',
    ip_address: data.ip_opt || data.ip_signup || 'N/A',
    signup_timestamp: data.timestamp_signup || 'N/A',
    opt_in_timestamp: data.timestamp_opt || 'N/A',
    has_merge_fields: !!data.merges,
    merge_field_count: data.merges ? Object.keys(data.merges).length : 0,
    merge_fields_summary: data.merges ? {
      first_name: data.merges.FNAME || 'N/A',
      last_name: data.merges.LNAME || 'N/A',
      company: data.merges.COMPANY || 'N/A',
      phone: data.merges.PHONE || 'N/A',
      interests: data.merges.INTERESTS || 'N/A',
      has_address: !!data.merges.ADDRESS,
    } : null,
  };
};

export const mailChimpSubscribeTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'subscribe',
  displayName: 'Member Subscribed to Audience',
  description: 'Fires when a new subscriber joins your Mailchimp audience. This trigger captures new subscriptions, opt-ins, and audience growth events with comprehensive subscriber information.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'subscribe',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: '8a25ff1d98',
      list_id: 'a6b5da1054',
      email: 'api@mailchimp.com',
      email_type: 'html',
      ip_opt: '192.168.1.100',
      ip_signup: '192.168.1.100',
      timestamp_signup: '2024-01-15T10:30:00Z',
      timestamp_opt: '2024-01-15T10:30:00Z',
      merges: {
        EMAIL: 'api@mailchimp.com',
        FNAME: 'Mailchimp',
        LNAME: 'API',
        COMPANY: 'Mailchimp Inc',
        PHONE: '+1-555-0123',
        INTERESTS: 'Group1,Group2',
        ADDRESS: {
          addr1: '675 Ponce de Leon Ave NE',
          addr2: 'Suite 5000',
          city: 'Atlanta',
          state: 'GA',
          zip: '30308',
          country: 'US',
        },
      },
      member_rating: 5,
      vip: false,
      language: 'en',
      source: 'api',
      tags: ['api-signup', 'new-subscriber'],
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
          subscribe: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        listId: context.propsValue.list_id as string,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable subscribe webhook: ${error.message || JSON.stringify(error)}`);
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
      console.error(`Failed to disable subscribe webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as MailChimpSubscribeWebhookRequest;

      if (!request || request.type !== 'subscribe') {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'member_subscribed',
        event_category: 'New Subscription',
        processed_at: new Date().toISOString(),
        subscription_summary: getSubscribeEventSummary(request),
        business_context: {
          audience_growth: true,
          new_lead: true,
          marketing_opportunity: true,
          engagement_potential: 'high',
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing subscribe webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
