import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const uploadAnAsset = createAction({
  name: 'uploadAnAsset',
  displayName: 'Upload an Asset',
  description: 'Upload media files (images, videos, or audio) to HeyGen. Supports JPEG, PNG, MP4, WEBM, and MPEG files.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (JPEG, PNG, MP4, WEBM, or MPEG)',
      required: true,
    }),
    file_type: Property.StaticDropdown({
      displayName: 'File Type',
      description: 'The type of file being uploaded',
      required: true,
      options: {
        options: [
          { label: 'Image (JPEG)', value: 'image/jpeg' },
          { label: 'Image (PNG)', value: 'image/png' },
          { label: 'Video (MP4)', value: 'video/mp4' },
          { label: 'Video (WEBM)', value: 'video/webm' },
          { label: 'Audio (MPEG)', value: 'audio/mpeg' },
        ],
      },
    }),
  },
  async run(context) {
    const { file, file_type } = context.propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://upload.heygen.com/v1/asset',
        headers: {
          'x-api-key': context.auth as string,
          'Content-Type': file_type,
        },
        body: file.data,
      });

      // The response will include:
      // - id: asset ID
      // - name: asset name
      // - file_type: type of the asset
      // - folder_id: folder ID
      // - meta: metadata
      // - image_key: key for photo avatars (if it's an image)
      return {
        success: true,
        asset_id: response.body.id,
        asset_name: response.body.name,
        file_type: response.body.file_type,
        folder_id: response.body.folder_id,
        meta: response.body.meta,
        image_key: response.body.image_key,
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      throw new Error(`Failed to upload asset: ${error.message}`);
    }
  },
});
