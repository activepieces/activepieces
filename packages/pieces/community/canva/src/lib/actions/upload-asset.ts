import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an image or video asset to your Canva media library from a URL.',
  props: {
    url: Property.ShortText({
      displayName: 'Asset URL',
      description: 'Publicly accessible URL of the image or video to upload.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'Display name for the uploaded asset.',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/assets/upload',
      body: {
        url: context.propsValue.url,
        name: context.propsValue.name,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
