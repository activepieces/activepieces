import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateOrgPaymentAction = createAction({
  name: 'update_org_payment',
  displayName: 'Update Organization Payment Info',
  description: 'Update payment information for your organization',
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
      method: HttpMethod.PUT,
      url: 'https://api.zoo.dev/org/payment',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        payment_method_id: propsValue.paymentMethodId,
      },
    });
    return response.body;
  },
});
