import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';

export const newPaymentTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Fires when a new payment is created/received',
  props: {},
  sampleData: {
    id: 'tr_example123',
    amount: { value: '100.00', currency: 'EUR' },
    status: 'paid',
    method: 'ideal',
    createdAt: '2024-01-01T12:00:00+00:00',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
  },
  async onDisable() {},
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.id?.startsWith('evt_') && payload.type === 'payment.created') {
      return [payload.data];
    }
    
    return [];
  },
});