import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getPaymentRefunds = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-payment-refunds',
  displayName: 'Get Payment Refunds',
  description: 'Returns all refunds of a payment.',
  audience: 'both',
  aiMetadata: { description: 'List all refunds issued against a given merchant-account payment. Use to review a payment\'s refund history or find a refund ID. Read-only and safe to repeat; to fetch one refund by its ID, use the single-refund lookup action instead.', idempotent: true },
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
