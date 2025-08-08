import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';

export const newInvoiceTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Fires when a new invoice is generated',
  props: {},
  sampleData: {
    id: 'inv_example123',
    number: 'INV-2024-001',
    status: 'open',
    createdAt: '2024-01-01T12:00:00+00:00',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
  },
  async onDisable() {},
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.id?.startsWith('evt_') && payload.type === 'invoice.created') {
      return [payload.data];
    }
    
    return [];
  },
});