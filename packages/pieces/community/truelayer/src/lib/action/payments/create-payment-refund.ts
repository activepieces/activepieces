import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const createPaymentRefund = createAction({
  auth: trueLayerCommon.auth,
  name: 'create-payment-refund',
  displayName: 'Create Payment Refund',
  description: 'Refund a merchant account payment, either fully or partially.',
  props: {
    id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The payment ID for the payment to be fully or partially refunded.',
      required: true,
    }),
    amount_in_minor: Property.ShortText({
      displayName: 'Amount in Minor Units',
      description: 'The amount to refund, expressed in minor units (e.g., 100 means 1 GBP).',
      required: false,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments/${ctx.propsValue.id}/refunds`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: {
        amount_in_minor: ctx.propsValue.amount_in_minor,
      },
    })

    return response.body;
  },
});
