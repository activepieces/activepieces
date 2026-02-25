import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { CANVA_BASE_URL } from '../common';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an image or video file to your Canva asset library.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'Image (JPG, PNG, GIF, WEBP, HEIC, TIFF — max 50 MB) or video (MP4, MOV, WEBM — max 500 MB).',
      required: true,
    }),
    assetName: Property.ShortText({
      displayName: 'Asset Name',
      description: 'Name for the asset (max 50 characters).',
      required: true,
    }),
  },
  async run(context) {
    const { file, assetName } = context.propsValue;

    if (assetName.length > 50) {
      throw new Error('Asset name must be 50 characters or fewer.');
    }

    const nameBase64 = Buffer.from(assetName.trim()).toString('base64');
    const fileBuffer = Buffer.from(file.base64, 'base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${CANVA_BASE_URL}/asset-uploads`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': JSON.stringify({ name_base64: nameBase64 }),
      },
      body: fileBuffer,
    });

    return response.body;
  },
});
