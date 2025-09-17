import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const retrivepayout = createAction({
  auth: stripeAuth,
  name: 'createARefund',
  displayName: 'Create A Refund',
  description: 'Create a refund for a charge or payment intent in Stripe.',
  props: {
    payout_id: Property.ShortText({
      displayName: 'Invoice ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { payout_id } = propsValue

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.stripe.com/v1/invoices/${payout_id}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});