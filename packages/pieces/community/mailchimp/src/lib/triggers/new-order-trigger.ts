import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

const STORE_KEY = 'mailchimp_new_order_cursor';

export const mailChimpNewOrderTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new-order',
  displayName: 'New Order',
  description: 'Fires when a new order is created in the connected store.',
  type: TriggerStrategy.POLLING,
  props: {
    store_id: Property.ShortText({
      displayName: 'Store ID',
      required: true,
    }),
  },
  sampleData: {
    id: 'ord_123',
    customer: { id: 'cst_123' },
    created_at: '2025-01-01T12:00:00+00:00',
    currency_code: 'USD',
    order_total: 99.99,
  },

  async onEnable() {
    /* no-op for polling */
  },
  async onDisable() {
    /* no-op for polling */
  },
  async run(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);
    const storeId = context.propsValue.store_id!;

    const last =
      (await context.store?.get<string>(STORE_KEY)) ??
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const url = new URL(
      `https://${server}.api.mailchimp.com/3.0/ecommerce/stores/${storeId}/orders`
    );
    url.searchParams.set('since_created_at', last);
    url.searchParams.set('count', '1000');

    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url.toString(),
      headers: { Authorization: `OAuth ${token}` },
    });

    const orders = (resp.body as any)?.orders ?? [];

    const newest = orders
      .map((o: any) => o?.created_at)
      .filter(Boolean)
      .sort()
      .at(-1);

    await context.store?.put(
      STORE_KEY,
      (newest as string) ?? new Date().toISOString()
    );
    return orders;
  },
});
