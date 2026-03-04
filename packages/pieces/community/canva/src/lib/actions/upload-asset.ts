import { createAction, Property, httpClient } from '@activepieces/pieces-framework';

export const uploadAsset = createAction({
  name: 'uploadAsset',
  displayName: 'Upload Asset',
  description: 'Upload an asset file to a specified Canva folder',
  props: {
    file: Property.File({
      displayName: 'File to Upload',
      required: true,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Optional Canva folder ID to upload into',
      required: false,
    }),
    auth: Property.StaticAuth({
      displayName: 'Authentication',
      required: true,
    }),
  },
  async run(context) {
    const { file, folderId } = context.propsValue;
    const accessToken = context.auth.access_token;
    // Prepare multipart upload
    const formData = new FormData();
    formData.append('file', file.data, file.name);
    if (folderId) {
      formData.append('folder_id', folderId);
    }
    const response = await httpClient.sendMultipart({
      url: 'https://api.canva.com/v1/assets',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      formData,
    });
    if (!response.ok) {
      throw new Error(`Canva upload failed: ${response.status} ${response.body}`);
    }
    return response.body;
  },
});