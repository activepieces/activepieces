import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createOrgPaymentAction = createAction({
  name: 'create_org_payment',
  displayName: 'Create Organization Payment Info',
  description: 'Create payment information for your organization',
  audience: 'both',
  aiMetadata: { description: 'Attach a payment method to the organization billing profile, given an existing payment method ID. Use for the org (the user has separate payment actions); this writes new billing data, so calling again may create duplicate or conflicting records.', idempotent: false },
  auth: zooAuth,
  // category: 'Payments',
  props: {
    paymentMethodId: Property.ShortText({
      displayName: 'Payment Method ID',
      required: true,
      description: 'ID of the payment method to use',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/org/payment',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        payment_method_id: propsValue.paymentMethodId,
      },
    });
    return response.body;
  },
});
