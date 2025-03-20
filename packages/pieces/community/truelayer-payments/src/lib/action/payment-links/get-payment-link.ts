import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common/common';

export const getPaymentLink = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-payment-link',
  displayName: 'Get Payment Link',
  description: 'Retrieves payment link details. This API must be called using a backend bearer token.',
  props: {
    id: Property.ShortText({
      displayName: 'Payment Link ID',
      description: 'The ID of the payment link to retrieve.',
      required: true,
    }),
  },
  run: async (ctx) => {
    return httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/payment-links/${ctx.propsValue.id}`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    }).then(res => res.body);
  },
});
