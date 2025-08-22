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

const STORE_KEY = 'mailchimp_new_customer_cursor';

export const mailChimpNewCustomerTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new-customer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is added to a connected store.',
  type: TriggerStrategy.POLLING,
  props: {
    store_id: Property.ShortText({
      displayName: 'Store ID',
      required: true,
    }),
  },
  sampleData: {
    id: 'cst_123',
    email_address: 'customer@example.com',
    created_at: '2025-01-01T12:00:00+00:00',
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

    // GET /ecommerce/stores/{store_id}/customers?since_created_at=...
    const url = new URL(
      `https://${server}.api.mailchimp.com/3.0/ecommerce/stores/${storeId}/customers`
    );
    url.searchParams.set('since_created_at', last);
    url.searchParams.set('count', '1000');

    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url.toString(),
      headers: { Authorization: `OAuth ${token}` },
    });

    const customers = (resp.body as any)?.customers ?? [];

    const newest = customers
      .map((c: any) => c?.created_at)
      .filter(Boolean)
      .sort()
      .at(-1);

    await context.store?.put(
      STORE_KEY,
      (newest as string) ?? new Date().toISOString()
    );
    return customers;
  },
});
