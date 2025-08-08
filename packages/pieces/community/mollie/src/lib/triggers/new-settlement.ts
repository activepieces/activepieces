import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';

export const newSettlementTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_settlement',
  displayName: 'New Settlement',
  description: 'Fires upon a new settlement event (e.g. payout)',
  props: {},
  sampleData: {
    id: 'stl_example123',
    amount: { value: '1000.00', currency: 'EUR' },
    status: 'open',
    createdAt: '2024-01-01T12:00:00+00:00',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
  },
  async onDisable() {},
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.id?.startsWith('evt_') && payload.type === 'settlement.created') {
      return [payload.data];
    }
    
    return [];
  },
});
