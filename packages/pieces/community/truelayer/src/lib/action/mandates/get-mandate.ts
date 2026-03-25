import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const getMandate = createAction({
  auth: trueLayerCommon.auth,
  name: 'get-mandate',
  displayName: 'Get Mandate',
  description: 'Returns a mandate with the stated ID. This endpoint can be called either by the regular `backend token` or the `mandate token` for that mandate.',
  props: {
    id: Property.ShortText({
      displayName: 'Mandate ID',
      description: 'The ID of the mandate to retrieve.',
      required: true,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/mandates/${ctx.propsValue.id}`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
    })

    return response.body;
  },
});
