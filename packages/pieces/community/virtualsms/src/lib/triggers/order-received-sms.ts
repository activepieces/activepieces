import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

interface OrderRow {
  order_id: string;
  status: string;
  phone_number?: string;
  service?: string;
  country?: string;
  price?: number;
  created_at?: string;
  expires_at?: string;
}

interface OrderListResp {
  orders?: OrderRow[];
  count?: number;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof virtualSmsAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const resp = await request<OrderListResp>(
      auth,
      HttpMethod.GET,
      '/api/v1/customer/orders',
      undefined,
      { status: 'completed' }
    );
    return (resp.orders ?? []).map((order) => ({
      epochMilliSeconds: new Date(order.created_at ?? 0).getTime(),
      data: order,
    }));
  },
};

export const orderReceivedSms = createTrigger({
  auth: virtualSmsAuth,
  name: 'order_received_sms',
  displayName: 'Order Received SMS',
  description:
    "Fires once per order that transitions to 'completed' — the VirtualSMS status when an SMS arrives and a code is available.",
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    order_id: 'f3c1cf52-ec0b-4908-83ff-58a2217a6633',
    phone_number: '541126335599',
    service: 'wa',
    country: 'AR',
    status: 'completed',
    price: 0.8,
    created_at: '2026-05-21T19:21:56Z',
    expires_at: '2026-05-21T19:41:56Z',
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
