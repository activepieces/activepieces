import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const getImage = createAction({
  auth: canvaAuth,
  name: 'get_image',
  displayName: 'Get Image',
  description: 'Get image/asset details',
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset identifier',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const assetId = context.propsValue.asset_id;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${canvaCommon.baseUrl}/${canvaCommon.assets}/${assetId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: true,
      asset: response.body,
    };
  },
});
