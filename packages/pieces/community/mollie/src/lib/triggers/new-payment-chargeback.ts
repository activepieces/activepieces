import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';

export const newChargebackTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_chargeback',
  displayName: 'New Payment Chargeback',
  description: 'Fires upon a payment chargeback event',
  props: {},
  sampleData: {
    id: 'chb_example123',
    amount: { value: '100.00', currency: 'EUR' },
    paymentId: 'tr_example123',
    createdAt: '2024-01-01T12:00:00+00:00',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
  },
  async onDisable() {},
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.id?.startsWith('evt_') && payload.type === 'chargeback.created') {
      return [payload.data];
    }
    
    return [];
  },
});