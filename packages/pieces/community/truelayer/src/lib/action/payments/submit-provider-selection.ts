import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const submitProviderSelection = createAction({
  auth: trueLayerCommon.auth,
  name: 'submit-provider-selection',
  displayName: 'Submit Provider Selection',
  description: 'Submit the provider details selected by the PSU. This API can be called using the `resource_token` associated with the payment or a backend bearer token.',
  audience: 'both',
  aiMetadata: { description: 'Advance a payment\'s authorization flow by submitting the bank provider the user selected. Use only when the flow has reached a provider-selection step. This mutates flow state and is not safe to repeat; it is the payment counterpart to the mandate provider-selection action.', idempotent: false },
  props: {
    id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the payment for which provider selection is being submitted.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await  httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/payments/${ctx.propsValue.id}/authorization-flow/actions/provider-selection`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: ctx.propsValue,
    })

    return response.body
  },
});
