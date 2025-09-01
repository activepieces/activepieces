import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_subscriber_updated_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

const getEventCategory = (eventType: string): string => {
  switch (eventType) {
    case 'profile':
      return 'Profile Update';
    case 'subscribe':
      return 'New Subscription';
    case 'upemail':
      return 'Email Change';
    case 'cleaned':
      return 'Email Cleanup';
    default:
      return 'Unknown Event';
  }
};

const getSubscriberSummary = (request: any): any => {
  const data = request.data || {};
  return {
    email: data.email || data.new_email || 'N/A',
    subscriber_id: data.id || 'N/A',
    list_id: data.list_id || 'N/A',
    email_type: data.email_type || 'html',
    member_rating: data.member_rating || 0,
    vip_status: data.vip ? 'VIP' : 'Standard',
    language: data.language || 'en',
    has_merge_fields: !!data.merges,
    merge_field_count: data.merges ? Object.keys(data.merges).length : 0,
    last_activity: data.last_changed || data.timestamp_opt || data.timestamp_signup || 'N/A',
    ip_address: data.ip_opt || data.ip_signup || 'N/A',
  };
};

export const mailChimpSubscriberUpdatedTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'subscriber_updated',
  displayName: 'Subscriber Updated',
  description: 'Fires when a subscriber profile is updated, including changes to merge fields, interests, or contact information. This trigger captures profile updates, new subscriptions, and subscriber modifications.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'profile',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: '8a25ff1d98',
      list_id: 'a6b5da1054',
      email: 'user@example.com',
      email_type: 'html',
      merges: {
        EMAIL: 'user@example.com',
        FNAME: 'John',
        LNAME: 'Doe',
        COMPANY: 'Example Corp',
        PHONE: '+1-555-0123',
        INTERESTS: 'Group1,Group2',
        ADDRESS: {
          addr1: '123 Main St',
          addr2: 'Suite 100',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
          country: 'US',
        },
      },
      new_email: 'newuser@example.com',
      old_email: 'user@example.com',
      member_rating: 5,
      vip: false,
      language: 'en',
      ip_opt: '192.168.1.100',
      ip_signup: '192.168.1.100',
      timestamp_signup: '2024-01-01T09:00:00Z',
      timestamp_opt: '2024-01-01T09:00:00Z',
      last_changed: '2024-01-15T10:30:00Z',
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
          profile: true, 
          subscribe: true,
          upemail: true,
          cleaned: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        listId: context.propsValue.list_id as string,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable subscriber updated webhook: ${error.message || JSON.stringify(error)}`);
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
      console.error(`Failed to disable subscriber updated webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as any;

      if (request === undefined || !['profile', 'subscribe', 'upemail', 'cleaned'].includes(request.type)) {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'subscriber_updated',
        event_category: getEventCategory(request.type),
        processed_at: new Date().toISOString(),
        subscriber_summary: getSubscriberSummary(request),
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing subscriber updated webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
