import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CANVA_API_BASE_URL } from '../common';
import { canvaAuth } from '../auth';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
};

export const uploadAssetAction = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Uploads an image or other asset file to your Canva media library.',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'A name for the uploaded asset.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The image or file to upload to Canva.',
      required: true,
    }),
  },
  async run(context) {
    const { name, file } = context.propsValue;
    const accessToken = context.auth.access_token;

    const extension = (file.extension ?? '').toLowerCase();
    const contentType = MIME_TYPES[extension] ?? 'application/octet-stream';

    const metadata = {
      name_base64: Buffer.from(name).toString('base64'),
    };
    const encodedMetadata = Buffer.from(JSON.stringify(metadata)).toString('base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${CANVA_API_BASE_URL}/assets/upload`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      headers: {
        'Content-Type': contentType,
        'Asset-Upload-Metadata': encodedMetadata,
      },
      body: file.data,
    });

    return response.body;
  },
});
