import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';

export const newOrderTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Fires when a new order is created',
  props: {},
  sampleData: {
    id: 'ord_example123',
    amount: { value: '100.00', currency: 'EUR' },
    status: 'created',
    createdAt: '2024-01-01T12:00:00+00:00',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
  },
  async onDisable() {},
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.id?.startsWith('evt_') && payload.type === 'order.created') {
      return [payload.data];
    }
    
    return [];
  },
});