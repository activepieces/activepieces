import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';

export const subscriptionPastDue = createTrigger({
  auth: paddleAuth,
  name: 'subscriptionPastDue',
  displayName: 'Subscription Past Due',
  description:
    'Triggers when a subscription goes past due — start dunning flows or restrict features.',
  aiMetadata: {
    description:
      'Fires on the Paddle subscription.past_due event, when a subscription enters past-due status because a renewal payment was not collected. Represents a subscription at risk of cancellation, useful for dunning flows or restricting features.',
  },
  props: {},
  sampleData: {
    event_id: 'evt_01abc125',
    event_type: 'subscription.past_due',
    occurred_at: '2024-01-01T00:00:00.000Z',
    data: {
      id: 'sub_01abc123',
      status: 'past_due',
      customer_id: 'ctm_01abc123',
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const setting = await paddleClient.createNotificationSetting({
      auth: context.auth,
      url: context.webhookUrl,
      subscribedEvents: ['subscription.past_due'],
    });
    await context.store.put<string>('notificationSettingId', setting.id);
  },

  async onDisable(context) {
    const notificationSettingId =
      await context.store.get<string>('notificationSettingId');
    if (notificationSettingId) {
      await paddleClient.deleteNotificationSetting({
        auth: context.auth,
        notificationSettingId,
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as any;
    if (payload.event_type !== 'subscription.past_due') {
      return [];
    }
    return [payload];
  },
});
