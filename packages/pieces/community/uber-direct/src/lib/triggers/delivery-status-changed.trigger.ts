import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { uberDirectAuth } from '../auth';

const KEY = 'uber-direct-delivery-status-changed';

export const deliveryStatusChangedTrigger = createTrigger({
  auth: uberDirectAuth,
  name: 'delivery_status_changed',
  displayName: 'Delivery Status Changed',
  description:
    'Triggers when a delivery status changes (pending, pickup, dropoff, delivered, canceled, returned).',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    delivery_id: 'del_abc123',
    status: 'delivered',
    courier: { name: 'John D', phone: '+27821234567' },
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
    return [{ delivery_id: 'test_del', status: 'delivered' }];
  },
});
