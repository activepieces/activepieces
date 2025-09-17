import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { payoutIdDropdown } from '../common';

export const retrivepayout = createAction({
  auth: stripeAuth,
  name: 'Retrive-Payout',
  displayName: 'Retrive Payout',
  description: 'Retrive Payout',
  props: {
    payout_id: payoutIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { payout_id } = propsValue

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.stripe.com/v1/payouts/${payout_id}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});