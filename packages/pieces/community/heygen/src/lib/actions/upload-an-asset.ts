import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { heygenAuth } from '../common/auth';

export const uploadAssetAction = createAction({
  auth: heygenAuth,
  name: 'upload_asset',
  displayName: 'Upload an Asset',
  description: 'Upload media files (images, videos, or audio) to HeyGen. Supports JPEG, PNG, MP4, WEBM, and MPEG files.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (JPEG, PNG, MP4, WEBM, or MPEG).',
      required: true,
    }),
  },
  async run(context) {
    const { file } = context.propsValue;

    const getContentType = (filename: string): string => {
      const extension = filename.toLowerCase().split('.').pop();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'mp4':
          return 'video/mp4';
        case 'webm':
          return 'video/webm';
        case 'mpeg':
        case 'mpg':
          return 'video/mpeg';
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }
    };

    const fileReference = await context.files.write({
      fileName: file.filename,
      data: file.data,
    });

    const contentType = getContentType(file.filename);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://upload.heygen.com/v1/asset',
      headers: {
        'x-api-key': context.auth as string,
        'Content-Type': contentType,
      },
      body: file.data,
    });

    return {
      success: true,
      asset_id: response.body.id,
      asset_name: response.body.name,
      file_type: response.body.file_type,
      folder_id: response.body.folder_id,
      meta: response.body.meta,
      image_key: response.body.image_key,
      file_reference: fileReference,
    };
  },
});
