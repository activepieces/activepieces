import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an asset (image, video, etc.) to Canva',
  props: {
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'URL of the file to upload',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the uploaded file',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Optional folder ID to upload to',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { fileUrl, fileName, folderId } = context.propsValue;

    const requestBody: Record<string, unknown> = {
      url: fileUrl,
    };

    if (fileName) {
      requestBody.name = fileName;
    }

    if (folderId) {
      requestBody.folderId = folderId;
    }

    const response = await fetch('https://api.canva.com/rest/v1/media', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload asset: ${error}`);
    }

    return await response.json();
  },
});