import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

interface OrderRow {
  id: string;
  status: string;
  phone_number?: string;
  service_id?: string;
  country_id?: string;
  expires_at?: string;
}

interface OrderListResp {
  orders?: OrderRow[];
}

export const orderExpired = createTrigger({
  auth: virtualSmsAuth,
  name: 'order_expired',
  displayName: 'Order Expired',
  description:
    "Polls /api/v1/customer/orders and fires once per order that newly transitions to 'expired'.",
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: '7e44ebb5-9a55-4bd8-a4e9-7f226f9d5ebd',
    phone_number: '541127399874',
    service_id: 'wa',
    country_id: 'AR',
    status: 'expired',
    expires_at: '2026-05-24T15:40:34Z',
  },

  async onEnable(context) {
    await context.store.put<string[]>('expiredSeen', []);
  },

  async onDisable(context) {
    await context.store.delete('expiredSeen');
  },

  async run(context) {
    const seen = (await context.store.get<string[]>('expiredSeen')) ?? [];
    const seenSet = new Set(seen);
    const resp = await request<OrderListResp>(
      context.auth,
      HttpMethod.GET,
      '/api/v1/customer/orders',
      undefined,
      { limit: '100' }
    );
    const fresh = (resp.orders ?? []).filter(
      (o) => o.status === 'expired' && !seenSet.has(o.id)
    );
    const updated = [
      ...seen,
      ...fresh.map((o) => o.id),
    ].slice(-1000);
    await context.store.put('expiredSeen', updated);
    return fresh;
  },

  async test() {
    return [];
  },
});
