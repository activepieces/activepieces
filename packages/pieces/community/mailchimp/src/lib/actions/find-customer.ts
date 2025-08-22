import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

export const mailChimpFindCustomer = createAction({
  auth: mailchimpAuth,
  name: 'find-customer',
  displayName: 'Find Customer',
  description: 'Finds a customer in a store by email address.',
  props: {
    store_id: Property.ShortText({ displayName: 'Store ID', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: true }),
  },
  async run(ctx) {
    const token = getAccessTokenOrThrow(ctx.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const url = new URL(
      `https://${server}.api.mailchimp.com/3.0/ecommerce/stores/${ctx.propsValue.store_id}/customers`
    );
    url.searchParams.set(
      'email_address',
      ctx.propsValue.email!.trim().toLowerCase()
    );
    url.searchParams.set('count', '1000');

    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url.toString(),
      headers: { Authorization: `OAuth ${token}` },
    });

    const customers = (resp.body as any)?.customers ?? [];

    return customers[0] ?? null;
  },
});
