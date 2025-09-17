import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
export const createARefund = createAction({
  auth: stripeAuth,
  name: 'createARefund',
  displayName: 'Create A Refund',
  description: '',
  props: {
    amount: Property.Number({
      displayName: "Amount",
      description: "",
      required: true
    }),
    charge: Property.ShortText({
      displayName: "Charge",
      description: "",
      required: true
    }),
    reason: Property.ShortText({
      displayName: "Reason",
      description: "",
      required: false
    })
  },
  async run({ auth, propsValue }) {
    const { amount, charge, reason } = propsValue
    const body: any = {
      amount,
      charge
    }

    if (reason) {
      body.reason = reason
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.stripe.com/v1/refunds`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body

    });

    return response.body;
  },
});
