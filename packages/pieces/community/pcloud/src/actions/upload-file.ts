import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pcloudAuth } from '../index';
import { getAccessToken, getApiUrl } from '../lib/auth';

export const uploadFile = createAction({
  auth: pcloudAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to pCloud',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Path to upload the file to (e.g., /Documents). Leave empty for root folder.',
      required: false,
      defaultValue: '/',
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Name of the file (optional, uses original filename if not specified)',
      required: false,
    }),
  },
  async run(context) {
    const { file, folderPath, filename } = context.propsValue;
    const apiUrl = getApiUrl(context.auth);
    const accessToken = getAccessToken(context.auth);

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file.base64, 'base64');
    const fileName = filename || file.filename || 'untitled';

    // Upload file
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), fileName);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${apiUrl}/uploadfile`,
      queryParams: {
        access_token: accessToken,
        path: folderPath || '/',
        filename: fileName,
      },
      body: formData,
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to upload file: ${response.body.error || 'Unknown error'}`);
    }

    return {
      success: true,
      file: response.body.metadata[0],
      message: `File "${fileName}" uploaded successfully`,
    };
  },
});
