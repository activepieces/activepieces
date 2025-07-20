import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const submitUserAccountSelection = createAction({
  auth: trueLayerCommon.auth,
  name: 'submit-user-account-selection',
  displayName: 'Submit User Account Selection',
  description: 'Submit the user account selection option given by the user. This API can be called using the `resource_token` associated with the payment or a backend bearer token.',
  props: {
    id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment for which the user account selection is being submitted.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments/${ctx.propsValue.id}/authorization-flow/actions/user-account-selection`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: ctx.propsValue,
    })

    return response.body;}
});
