import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const getAsset = createAction({
  auth: canvaAuth,
  name: 'get_asset',
  displayName: 'Get Asset',
  description: 'Retrieve metadata for a Canva asset by its ID.',
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the asset to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.canva.com/rest/v1/assets/${context.propsValue.asset_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
