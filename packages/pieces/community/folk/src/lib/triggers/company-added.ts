import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const companyAdded = createTrigger({
  auth: folkAuth,
  name: 'company_added',
  displayName: 'Company Added',
  description: 'Fires when a new company is added to your Folk workspace.',
  props: {
    groupId: folkProps.group_id(false, 'Group ID'),
  },
  sampleData: {
    eventType: 'company.created',
    eventId: 'evt_123e4567-e89b-12d3-a456-426614174000',
    timestamp: '2025-10-28T12:00:00.000Z',
    data: {
      id: 'com_92346499-30bf-4278-ae8e-4aa3ae2ace2c',
      name: 'Tech Corp',
      description: 'A technology company',
      createdAt: '2024-01-01T00:00:00Z',
      emails: ['contact@techcorp.com'],
      urls: ['https://techcorp.com'],
      addresses: ['123 Tech Street, San Francisco, CA'],
      phones: ['+1-555-0123'],
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const eventConfig: any = {
      eventType: 'company.created',
    };

    if (context.propsValue?.groupId) {
      eventConfig.filter = {
        groupId: context.propsValue.groupId,
      };
    }

    const subscribedEvents = [eventConfig];

    const webhook = await folkClient.createWebhook({
      apiKey: context.auth,
      name: `Activepieces Company Added - ${Date.now()}`,
      targetUrl: context.webhookUrl,
      subscribedEvents,
    });

    await context.store?.put('_webhookId', webhook.data.id);
    // await context.store?.put('_signingSecret', webhook.data.signingSecret);
  },

  async onDisable(context) {
    const webhookId = (await context.store?.get('_webhookId')) as string;
    if (webhookId) {
      try {
        await folkClient.deleteWebhook({
          apiKey: context.auth,
          webhookId,
        });
      } catch (error) {
        console.warn('Failed to delete webhook:', error);
      }
    }
  },

  async run(context) {
    const payloadBody = context.payload.body as any;
    return [payloadBody];
  },
});
