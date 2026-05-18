import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { trueLayerCommon } from '../../common';

export const listMandate = createAction({
  auth: trueLayerCommon.auth,
  name: 'list-mandate',
  displayName: 'List Mandates',
  description: 'List all the mandates associated with the client. This API must be called using a backend bearer token.',
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'Optional ID of the user whose mandates you want to list.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Optional cursor for pagination.',
      required: false,
    }),
    limit: Property.ShortText({
      displayName: 'Limit',
      description: 'Optional limit on the number of mandates to return.',
      required: false,
    }),
  },
  run: async (ctx) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${trueLayerCommon.baseUrl}/v3/mandates`,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
      },
      queryParams: {
        user_id: ctx.propsValue.user_id || '',
        cursor: ctx.propsValue.cursor || '',
        limit: ctx.propsValue.limit || '',
      },
    })

    return response.body;
  },
});
