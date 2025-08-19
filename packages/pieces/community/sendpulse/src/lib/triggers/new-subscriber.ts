import {
  createTrigger,
  TriggerStrategy,
  WebhookResponse,
} from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { sendpulseApiCall } from '../common/client';
import { mailingListDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const newSubscriberTrigger = createTrigger({
  auth: sendpulseAuth,
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Fires when new subscriber is added',
  type: TriggerStrategy.WEBHOOK,
  props: {
    mailingListId: mailingListDropdown,
  },

  async onEnable(context) {
    const { mailingListId } = context.propsValue;
    
    try {
      const webhookResponse = await sendpulseApiCall<{
        success: boolean;
        data: Array<{ id: number; action: string; url: string }>;
      }>({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: '/v2/email-service/webhook',
        body: {
          url: context.webhookUrl,
          actions: ['new_emails'],
        },
      });

      if (webhookResponse.success && webhookResponse.data?.length > 0) {
        const webhook = webhookResponse.data.find(w => w.action === 'new_emails');
        if (webhook) {
          await context.store.put('webhook_id', webhook.id);
          await context.store.put('mailing_list_id', mailingListId);
        }
      } else {
        throw new Error('Failed to create webhook');
      }
    } catch (error: any) {
      throw new Error(`Failed to enable new subscriber trigger: ${error.message}`);
    }
  },

  async onDisable(context) {
    try {
      const webhookId = await context.store.get('webhook_id');
      
      if (webhookId) {
        await sendpulseApiCall({
          method: HttpMethod.DELETE,
          auth: context.auth,
          resourceUri: `/v2/email-service/webhook/${webhookId}`,
        });
        
        await context.store.delete('webhook_id');
        await context.store.delete('mailing_list_id');
      }
    } catch (error) {
      console.warn('Failed to delete webhook during disable:', error);
    }
  },

  async run(context) {
    const storedListId = await context.store.get('mailing_list_id');
    
    interface NewSubscriberPayload {
      timestamp: string;
      variables: any[];
      email: string;
      source: string;
      book_id: string;
      event: string;
    }

    const payload = context.payload.body as NewSubscriberPayload | NewSubscriberPayload[];
    
    const payloads = Array.isArray(payload) ? payload : [payload];
    
    const results = [];
    
    for (const item of payloads) {
      if (item.event === 'new_emails' && item.book_id === storedListId) {
        results.push({
          id: `${item.email}_${item.timestamp}`,
          email: item.email,
          mailingListId: item.book_id,
          source: item.source,
          variables: item.variables || {},
          addedAt: new Date(parseInt(item.timestamp) * 1000).toISOString(),
          timestamp: item.timestamp,
        });
      }
    }

    return results;
  },

  async test() {
    return [
      {
        id: 'demo@example.com_1496827625',
        email: 'demo@example.com',
        mailingListId: '123456',
        source: 'address book',
        variables: {},
        addedAt: new Date().toISOString(),
        timestamp: '1496827625',
      },
    ];
  },

  sampleData: {
    id: 'subscriber@example.com_1496827625',
    email: 'subscriber@example.com',
    mailingListId: '123456',
    source: 'subscription form',
    variables: {
      name: 'John Doe',
    },
    addedAt: '2023-06-01T12:00:00.000Z',
    timestamp: '1496827625',
  },
});
