import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const saveUserAccountPayment = createAction({
  auth: trueLayerCommon.auth,
  name: 'save-user-account-payment',
  displayName: 'Save Payment Account',
  description: 'Save the account details associated with a payment for subsequent re-use. This API can be called using the `resource_token` associated with the payment or a backend bearer token.',
  props: {
    id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment to save the account details for.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments/${ctx.propsValue.id}/actions/save-user-account`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: ctx.propsValue,
    })

    return response.body;
  },
});
