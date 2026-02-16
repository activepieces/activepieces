import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const uploadAssetAction = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an image or video asset to Canva',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'The name of the asset',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (image or video)',
      required: true,
    }),
  },
  async run(context) {
    const { name, file } = context.propsValue;

    // Canva asset upload uses application/octet-stream with metadata in header
    const nameBase64 = Buffer.from(name).toString('base64');
    const metadata = JSON.stringify({ name_base64: nameBase64 });
    const fileBuffer = Buffer.from(file.base64, 'base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/asset-uploads',
      headers: {
        'Authorization': `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': metadata,
      },
      body: fileBuffer,
    });

    return response.body;
  },
});
