import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';

export const paymentFailed = createTrigger({
  auth: paddleAuth,
  name: 'paymentFailed',
  displayName: 'Payment Failed',
  description:
    'Triggers when a transaction payment fails — trigger retry logic or alert the customer.',
  props: {},
  sampleData: {
    event_id: 'evt_01abc127',
    event_type: 'transaction.payment_failed',
    occurred_at: '2024-01-01T00:00:00.000Z',
    data: {
      id: 'txn_01abc123',
      status: 'past_due',
      customer_id: 'ctm_01abc123',
      payments: [
        {
          amount: '1000',
          status: 'failed',
          error_code: 'declined',
        },
      ],
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const setting = await paddleClient.createNotificationSetting({
      auth: context.auth,
      url: context.webhookUrl,
      subscribedEvents: ['transaction.payment_failed'],
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
    if (payload.event_type !== 'transaction.payment_failed') {
      return [];
    }
    return [payload];
  },
});
