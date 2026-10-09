import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { courierGuyAuth } from '../auth';

const KEY = 'courier-guy-shipment-status-changed';

export const shipmentStatusChangedTrigger = createTrigger({
  auth: courierGuyAuth,
  name: 'shipment_status_changed',
  displayName: 'Shipment Status Changed',
  description: 'Triggers when a shipment status changes (collected, in transit, delivered).',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    tracking_reference: 'CG123456789',
    status: 'delivered',
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
  async test(context) {
    return [{ tracking_reference: 'TEST123', status: 'delivered' }];
  },
});
