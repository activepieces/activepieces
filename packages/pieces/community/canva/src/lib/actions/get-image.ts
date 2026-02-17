import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';

export const canvaGetImage = createAction({
  auth: canvaAuth,
  name: 'get_canva_image',
  description: 'Retrieve details about an existing image asset in Canva',
  displayName: 'Get an Image',
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the image asset to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.canva.com/rest/v1/assets/${context.propsValue.asset_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
