import {
  createTrigger,
  TriggerStrategy,
  WebhookResponse,
} from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { sendpulseApiCall } from '../common/client';
import { mailingListDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const newUnsubscriberTrigger = createTrigger({
  auth: sendpulseAuth,
  name: 'new_unsubscriber',
  displayName: 'New Unsubscriber',
  description: 'Fires when subscriber unsubscribes',
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
          actions: ['unsubscribe'],
        },
      });

      if (webhookResponse.success && webhookResponse.data?.length > 0) {
        const webhook = webhookResponse.data.find(w => w.action === 'unsubscribe');
        if (webhook) {
          await context.store.put('webhook_id', webhook.id);
          await context.store.put('mailing_list_id', mailingListId);
        }
      } else {
        throw new Error('Failed to create webhook');
      }
    } catch (error: any) {
      throw new Error(`Failed to enable unsubscriber trigger: ${error.message}`);
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
    
    interface UnsubscribePayload {
      task_id: string;
      timestamp: string;
      from_all: string;
      email: string;
      reason: string | null;
      book_id: string;
      event: string;
      categories: string;
    }

    const payload = context.payload.body as UnsubscribePayload | UnsubscribePayload[];
    
    const payloads = Array.isArray(payload) ? payload : [payload];
    
    const results = [];
    
    for (const item of payloads) {
      if (item.event === 'unsubscribe' && item.book_id === storedListId) {
        results.push({
          id: `${item.email}_${item.timestamp}`,
          email: item.email,
          mailingListId: item.book_id,
          taskId: item.task_id,
          fromAll: item.from_all === '1',
          reason: item.reason || 'No reason provided',
          categories: item.categories || '',
          unsubscribedAt: new Date(parseInt(item.timestamp) * 1000).toISOString(),
          timestamp: item.timestamp,
        });
      }
    }

    return results;
  },

  async test() {
    return [
      {
        id: 'test-unsubscribe@example.com_1496827872',
        email: 'test-unsubscribe@example.com',
        mailingListId: '123456',
        taskId: '3668141',
        fromAll: true,
        reason: 'User clicked unsubscribe link',
        categories: '',
        unsubscribedAt: new Date().toISOString(),
        timestamp: '1496827872',
      },
    ];
  },

  sampleData: {
    id: 'unsub@example.com_1496827872',
    email: 'unsub@example.com',
    mailingListId: '123456',
    taskId: '3668141',
    fromAll: false,
    reason: 'Manual unsubscribe',
    categories: 'newsletter',
    unsubscribedAt: '2023-06-01T12:30:00.000Z',
    timestamp: '1496827872',
  },
});
