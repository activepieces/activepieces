import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getPaymentRefund = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-payment-refund',
  displayName: 'Get Payment Refund',
  description: 'Returns refund details for a specific payment.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve details and status of a single refund, identified by both its payment ID and refund ID. Use when you know the specific refund you want to inspect. Read-only and safe to repeat; to list every refund on a payment instead, use the get-all-refunds action.', idempotent: true },
  props: {
    payment_id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment for which the refund was made.',
      required: true,
    }),
    refund_id: Property.ShortText({
      displayName: 'Refund ID',
      description: 'The ID of the refund to retrieve details for.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/payments/${ctx.propsValue.payment_id}/refunds/${ctx.propsValue.refund_id}`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })

    return response.body;
  },
});
