import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getMerchantAccountPaymentSources = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-merchant-account-payment-sources',
  displayName: 'Get Payment Sources',
  description: 'Get the payment sources from which the merchant account has received payments.',
  props: {
    id: Property.ShortText({
      displayName: 'Merchant Account ID',
      description: 'The ID of the merchant account into which payments were made.',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user whose payment sources are being retrieved.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/merchant-accounts/${ctx.propsValue.id}/payment-sources`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      queryParams: {
        user_id: ctx.propsValue.user_id,
      },
    })

    return response.body;
  },
});
