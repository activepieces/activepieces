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
  expires_at?: string;
  created_at?: string;
}

interface OrderListResp {
  orders?: OrderRow[];
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
      { status: 'expired' }
    );
    return (resp.orders ?? []).map((order) => ({
      epochMilliSeconds: new Date(order.created_at ?? 0).getTime(),
      data: order,
    }));
  },
};

export const orderExpired = createTrigger({
  auth: virtualSmsAuth,
  name: 'order_expired',
  displayName: 'Order Expired',
  description: "Fires once per order that transitions to 'expired' without receiving an SMS.",
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    order_id: '7e44ebb5-9a55-4bd8-a4e9-7f226f9d5ebd',
    phone_number: '541127399874',
    service: 'wa',
    country: 'AR',
    status: 'expired',
    expires_at: '2026-05-24T15:40:34Z',
    created_at: '2026-05-24T15:20:34Z',
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
