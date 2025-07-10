import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createPayoutAction = createAction({
  name: 'create_payout',
  auth: checkoutComAuth,
  displayName: 'Create Payout',
  description: 'Transfer merchant earnings.',
  props: {
    destination: Property.ShortText({
      displayName: 'Destination',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run(context) {
    const { destination, amount, currency, reference, description } = context.propsValue;
    const body: Record<string, any> = {
      destination,
      amount,
      currency,
    };
    if (reference) body.reference = reference;
    if (description) body.description = description;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.checkout.com/payouts',
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
}); 