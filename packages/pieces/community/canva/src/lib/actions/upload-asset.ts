import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';
import { canvaCommon } from '../common';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an image or video asset to the user\'s Canva content library from a URL.',
  props: {
    url: Property.ShortText({
      displayName: 'File URL',
      description: 'The public URL of the file to upload.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'A name for the uploaded asset.',
      required: true,
    }),
  },
  async run(context) {
    const { url, name } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    // Download the file first
    const fileResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      responseType: 'arraybuffer' as any,
    });

    const nameBase64 = Buffer.from(name).toString('base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${canvaCommon.baseUrl}/asset-uploads`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': JSON.stringify({ name_base64: nameBase64 }),
      },
      body: fileResponse.body,
    });

    return response.body;
  },
});
