import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getConstraints = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-constraints',
  displayName: 'Get Mandate Constraints',
  description: 'Retrieve the constraints defined on the mandate, as well as the current utilization of those constraints within the periods.',
  props: {
    id: Property.ShortText({
      displayName: 'Mandate ID',
      description: 'The ID of the mandate to retrieve the constraints for.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/mandates/${ctx.propsValue.id}/constraints`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })
    return response.body

  },
});
