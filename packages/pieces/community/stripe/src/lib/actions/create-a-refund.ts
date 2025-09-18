import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { chargeIdDropdown } from '../common';
export const createARefund = createAction({
  auth: stripeAuth,
  name: 'createARefund',
  displayName: 'Create A Refund',
  description: 'Create a full or partial refund for a charge.',
  props: {
    amount: Property.Number({
      displayName: "Amount",
      description: "",
      required: true
    }),
    charge: chargeIdDropdown,
    reason: Property.StaticDropdown({
      displayName: 'Reason',
      description: 'An optional reason for the refund.',
      required: false,
      options: {
        options: [
          { label: 'Duplicate', value: 'duplicate' },
          { label: 'Fraudulent', value: 'fraudulent' },
          { label: 'Requested by Customer', value: 'requested_by_customer' },
        ],
      },
    }),
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
      method: HttpMethod.POST,
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
