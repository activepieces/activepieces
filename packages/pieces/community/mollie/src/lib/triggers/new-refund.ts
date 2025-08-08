import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';

export const newRefundTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_refund',
  displayName: 'New Refund',
  description: 'Fires when a payment refund is created',
  props: {},
  sampleData: {
    id: 'rf_example123',
    amount: { value: '50.00', currency: 'EUR' },
    status: 'pending',
    paymentId: 'tr_example123',
    createdAt: '2024-01-01T12:00:00+00:00',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
  },
  async onDisable() {},
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.id?.startsWith('evt_') && payload.type === 'refund.created') {
      return [payload.data];
    }
    
    return [];
  },
});
