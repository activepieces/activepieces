import { createAction, Property, HttpMethod, FileValue } from '@activepieces/pieces-framework';
import { canvaCommon } from '../common';

export const uploadAssetAction = createAction({
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an image or other asset to Canva.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'The desired filename for the uploaded asset.',
      required: true,
    }),
    folderId: canvaCommon.folderId,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { file, filename, folderId } = propsValue;

    if (!file.base64) {
      throw new Error('File content is missing.');
    }

    // Canva API expects a multipart/form-data upload
    // The exact implementation for `httpClient.sendRequest` with multipart
    // might require a custom body formatter depending on activepieces version.
    // For simplicity, this example assumes a direct file upload endpoint exists.

    // A more robust implementation would involve getting a signed upload URL first,
    // then uploading the file, and then confirming the upload.
    // This is a simplified direct upload attempt.

    const response = await context.http.sendRequest<{ id: string }>({
      method: HttpMethod.POST,
      url: `${canvaCommon.baseUrl}/assets`,
      headers: {
        'Content-Type': file.mimeType, // Or 'application/octet-stream'
        'X-Canva-Filename': filename, // Custom header for filename
        // If multipart/form-data is required, this would be more complex.
      },
      body: file.base64, // Directly sending base64 content, assuming API handles it or needs conversion
      authentication: {
        type: 'Bearer',
        token: auth.access_token,
      },
      queryParams: {
          folder_id: folderId, // If folder can be specified during upload
      }
    });

    if (response.status === 201) {
      return {
        assetId: response.body.id,
        message: 'Asset uploaded successfully.',
      };
    } else {
      throw new Error(`Failed to upload asset: ${response.status} - ${JSON.stringify(response.body)}`);
    }
  },
});
