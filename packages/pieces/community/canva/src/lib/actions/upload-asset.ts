import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { canvaAuth } from '../..';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an asset (image or video) to the user\'s Canva content library.',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'The name of the asset.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (image or video).',
      required: true,
    }),
  },
  async run(context) {
    const nameBase64 = Buffer.from(context.propsValue.name).toString('base64');
    const fileBuffer = Buffer.from(context.propsValue.file.base64, 'base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/asset-uploads',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': JSON.stringify({
          name_base64: nameBase64,
        }),
      },
      body: fileBuffer,
    });

    return response.body;
  },
});
