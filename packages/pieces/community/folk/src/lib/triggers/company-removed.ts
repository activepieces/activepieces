import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const companyRemoved = createTrigger({
  auth: folkAuth,
  name: 'company_removed',
  displayName: 'Company Removed',
  description: 'Fires when a company is removed from your Folk workspace.',
  props: {
     groupId: folkProps.group_id(false, 'Group ID'),
  },
  sampleData: {
    eventType: 'company.deleted',
    eventId: 'evt_123e4567-e89b-12d3-a456-426614174000',
    timestamp: '2025-10-28T12:00:00.000Z',
    data: {
      id: 'com_92346499-30bf-4278-ae8e-4aa3ae2ace2c',
      name: 'Tech Corp',
      deletedAt: '2025-10-28T12:00:00.000Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const eventConfig: any = {
      eventType: 'company.deleted',
    };

    if (context.propsValue?.groupId) {
      eventConfig.filter = {
        groupId: context.propsValue.groupId,
      };
    }

    const subscribedEvents = [eventConfig];

    const webhook = await folkClient.createWebhook({
      apiKey: context.auth,
      name: `Activepieces Company Removed - ${Date.now()}`,
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
