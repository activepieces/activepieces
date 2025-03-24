import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const submitForm = createAction({
  auth: trueLayerCommon.auth,
  name: 'submit-form',
  displayName: 'Submit Form',
  description: 'Submit form details filled by the PSU. This API can be called using the `resource_token` associated with the payment or a backend bearer token.',
  props: {
    id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment for which the form is being submitted.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments/${ctx.propsValue.id}/authorization-flow/actions/form`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: ctx.propsValue,
    })

    return response.body;
  },
});
