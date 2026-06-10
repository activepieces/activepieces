import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';

export const transactionCompleted = createTrigger({
  auth: paddleAuth,
  name: 'transactionCompleted',
  displayName: 'Transaction Completed',
  description:
    'Triggers when a transaction completes successfully — send a receipt or update records.',
  props: {},
  sampleData: {
    event_id: 'evt_01abc126',
    event_type: 'transaction.completed',
    occurred_at: '2024-01-01T00:00:00.000Z',
    data: {
      id: 'txn_01abc123',
      status: 'completed',
      customer_id: 'ctm_01abc123',
      details: {
        totals: {
          total: '1000',
          tax: '100',
          subtotal: '900',
          currency_code: 'USD',
        },
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const setting = await paddleClient.createNotificationSetting({
      auth: context.auth,
      url: context.webhookUrl,
      subscribedEvents: ['transaction.completed'],
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
    if (payload.event_type !== 'transaction.completed') {
      return [];
    }
    return [payload];
  },
});
