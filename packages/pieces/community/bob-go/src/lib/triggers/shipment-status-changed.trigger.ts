import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bobGoAuth } from '../auth';

const KEY = 'bob-go-shipment-status-changed';

export const shipmentStatusChangedTrigger = createTrigger({
  auth: bobGoAuth,
  name: 'shipment_status_changed',
  displayName: 'Shipment Status Changed',
  description: 'Triggers when a shipment status changes.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    tracking_reference: 'BG123456789',
    status: 'collected',
    updated_at: '2026-10-09T14:00:00.000Z',
  },
  async onEnable(context) {
    await context.store.put(KEY, { url: context.webhookUrl, at: new Date().toISOString() });
  },
  async onDisable(context) {
    await context.store.delete(KEY);
  },
  async run(context) {
    return [context.payload.body];
  },
  async test() {
    return [{ tracking_reference: 'TEST123', status: 'collected' }];
  },
});
