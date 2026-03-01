import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getPaymentLinkPayments = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-payment-link-payments',
  displayName: 'Get Payments',
  description: 'List all the payments associated with the payment link. This API must be called using a backend bearer token.',
  props: {
    id: Property.ShortText({
      displayName: 'Payment Link ID',
      description: 'The ID of the payment link for which payments are being retrieved.',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor used for pagination purposes, returned as `next_cursor` in the response payload of the initial request. Not required for the first page of items.',
      required: false,
    }),
    limit: Property.ShortText({
      displayName: 'Limit',
      description: 'Optional limit on the number of payments to return.',
      required: false,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/payment-links/${ctx.propsValue.id}/payments`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      queryParams: {
        cursor: ctx.propsValue.cursor || '',
        limit: ctx.propsValue.limit || '',
      },
    })

    return response.body;
  },
});
