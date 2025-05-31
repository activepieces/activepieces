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
  },
  async run(context) {
    const { file } = context.propsValue;

    // Determine content type based on file extension
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

    try {
      // Write file to storage and get reference
      const fileReference = await context.files.write({
        fileName: file.filename,
        data: file.data
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
        file_reference: fileReference,
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid file format or content type.');
      }
      if (error.response?.status === 413) {
        throw new Error('File size too large. Please check HeyGen file size limits.');
      }
      throw new Error(`Failed to upload asset: ${error.message}`);
    }
  },
});
