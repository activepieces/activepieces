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
  price_charged?: number;
  created_at?: string;
  expires_at?: string;
}

interface OrderListResp {
  orders?: OrderRow[];
  count?: number;
}

export const orderReceivedSms = createTrigger({
  auth: virtualSmsAuth,
  name: 'order_received_sms',
  displayName: 'Order Received SMS',
  description:
    "Polls /api/v1/customer/orders and fires once per order that newly transitions to 'completed' (the VirtualSMS terminal state when an SMS arrives).",
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 'f3c1cf52-ec0b-4908-83ff-58a2217a6633',
    phone_number: '541126335599',
    service_id: 'wa',
    country_id: 'AR',
    status: 'completed',
    price_charged: 0.8,
    created_at: '2026-05-21T19:21:56Z',
    expires_at: '2026-05-21T19:41:56Z',
  },

  async onEnable(context) {
    await context.store.put<string[]>('seen', []);
  },

  async onDisable(context) {
    await context.store.delete('seen');
  },

  async run(context) {
    const seen = (await context.store.get<string[]>('seen')) ?? [];
    const seenSet = new Set(seen);
    const resp = await request<OrderListResp>(
      context.auth,
      HttpMethod.GET,
      '/api/v1/customer/orders',
      undefined,
      { limit: '100' }
    );
    // VirtualSMS marks SMS-received orders as status="completed", not "received".
    const fresh = (resp.orders ?? []).filter(
      (o) => o.status === 'completed' && !seenSet.has(o.id)
    );
    const updated = [
      ...seen,
      ...fresh.map((o) => o.id),
    ].slice(-1000);
    await context.store.put('seen', updated);
    return fresh;
  },

  async test() {
    return [];
  },
});
