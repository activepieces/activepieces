import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';

export const newActiveSubscription = createTrigger({
  auth: paddleAuth,
  name: 'newActiveSubscription',
  displayName: 'New Active Subscription',
  description:
    'Triggers when a subscription activates — a trial converts or the first payment succeeds.',
  props: {},
  sampleData: {
    event_id: 'evt_01abc123',
    event_type: 'subscription.activated',
    occurred_at: '2024-01-01T00:00:00.000Z',
    data: {
      id: 'sub_01abc123',
      status: 'active',
      customer_id: 'ctm_01abc123',
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const setting = await paddleClient.createNotificationSetting({
      auth: context.auth,
      url: context.webhookUrl,
      subscribedEvents: ['subscription.activated'],
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
    if (payload.event_type !== 'subscription.activated') {
      return [];
    }
    return [payload];
  },
});
