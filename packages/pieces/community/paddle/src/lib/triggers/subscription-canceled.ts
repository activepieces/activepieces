import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';

export const subscriptionCanceled = createTrigger({
  auth: paddleAuth,
  name: 'subscriptionCanceled',
  displayName: 'Subscription Canceled',
  description: 'Triggers when a subscription is canceled — revoke access or notify support.',
  props: {},
  sampleData: {
    event_id: 'evt_01abc124',
    event_type: 'subscription.canceled',
    occurred_at: '2024-01-01T00:00:00.000Z',
    data: {
      id: 'sub_01abc123',
      status: 'canceled',
      customer_id: 'ctm_01abc123',
      canceled_at: '2024-01-01T00:00:00.000Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const setting = await paddleClient.createNotificationSetting({
      auth: context.auth,
      url: context.webhookUrl,
      subscribedEvents: ['subscription.canceled'],
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
    if (payload.event_type !== 'subscription.canceled') {
      return [];
    }
    return [payload];
  },
});
