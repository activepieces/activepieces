import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { heygenAuth } from '../../index';

export const uploadAssetAction = createAction({
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Uploads an asset (image, video, or audio) to HeyGen.',
  auth: heygenAuth,
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The asset file to upload (image, video, or audio)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { file } = propsValue;
    const apiKey = auth as string;

    const ext = file.filename.split('.').pop()?.toLowerCase();
    let contentType: string;

    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'mp4':
        contentType = 'video/mp4';
        break;
      case 'webm':
        contentType = 'video/webm';
        break;
      case 'mp3':
        contentType = 'audio/mpeg';
        break;
      default:
        throw new Error(`Unsupported file extension: .${ext}`);
    }

    const formData = new FormData();
    formData.append('file', Buffer.from(file.base64, 'base64'), {
      filename: file.filename,
      contentType: contentType,
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://upload.heygen.com/v1/asset',
      headers: {
        'X-Api-Key': apiKey,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    return response.body;
  },
});
