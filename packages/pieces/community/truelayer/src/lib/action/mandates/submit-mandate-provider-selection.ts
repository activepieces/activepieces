import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const submitMandateProviderSelection = createAction({
  auth: trueLayerCommon.auth,
  name: 'submit-mandate-provider-selection',
  displayName: 'Submit provider selection',
  description: 'Submit the provider details selected by the PSU. This API can be called using either the mandate_token associated with the mandate or a backend bearer token.',
  audience: 'both',
  aiMetadata: { description: 'Advance a mandate\'s authorization flow by submitting the bank provider the user selected. Use during an interactive mandate setup when the flow requires a provider-selection step. This mutates the flow state and is not safe to repeat; it is the mandate counterpart to the payment provider-selection action.', idempotent: false },
  props: {
    id: Property.ShortText({
      displayName: 'Mandate ID',
      description: 'The ID of the mandate for which provider selection is being submitted.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/mandates/${ctx.propsValue.id}/authorization-flow/actions/provider-selection`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: ctx.propsValue,
    })

    return response.body;
  },
});
