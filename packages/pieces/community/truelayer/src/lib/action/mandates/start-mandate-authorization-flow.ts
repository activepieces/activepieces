import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const startMandateAuthorizationFlow = createAction({
  auth: trueLayerCommon.auth,
  name: 'start-mandate-authorization-flow',
  displayName: 'Start Authorization Flow',
  description: 'Start the authorization flow for a mandate. This API can be called using either the mandate_token associated with the mandate or a backend bearer token.',
  audience: 'both',
  aiMetadata: { description: 'Begin the authorization flow for an existing mandate identified by its ID so the user can authorize the recurring payment arrangement. Use after the mandate is created; this advances mandate state and is not idempotent. Follow with Submit consent if the flow requires it.', idempotent: false },
  props: {
    id: Property.ShortText({
      displayName: 'Mandate ID',
      description: 'The ID of the mandate to start the authorization flow for.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/mandates/${ctx.propsValue.id}/authorization-flow`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      body: ctx.propsValue,
    })

    return response.body;
  },
});
