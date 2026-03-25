import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getPaymentRefunds = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-payment-refunds',
  displayName: 'Get Payment Refunds',
  description: 'Returns all refunds of a payment.',
  props: {
    id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the merchant account payment to retrieve all refunds for.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/payments/${ctx.propsValue.id}/refunds`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })
    
    return response.body
  },
});
