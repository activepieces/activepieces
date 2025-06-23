import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const revokeMandate = createAction({
  auth: trueLayerCommon.auth,
  name: 'revoke-mandate',
  displayName: 'Revoke Mandate',
  description: 'Revoke a mandate. This API must be called using a backend bearer token.',
  props: {
    id: Property.ShortText({
      displayName: 'Mandate ID',
      description: 'The ID of the mandate to revoke.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${trueLayerCommon.baseUrl}/v3/mandates/${ctx.propsValue.id}/revoke`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })

    return response.body;
  },
});
