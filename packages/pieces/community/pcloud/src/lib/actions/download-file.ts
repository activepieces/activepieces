import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from '../common/constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const downloadFile = createAction({
  name: 'download-file',
  displayName: 'Download File',
  description: 'Download a file from your pCloud storage',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'ID of the file to download',
      required: false,
    }),
    filePath: Property.ShortText({
      displayName: 'File Path',
      description: 'Path of the file to download (e.g., /Documents/file.txt)',
      required: false,
    }),
  },
  async run(context) {
    const { fileId, filePath } = context.propsValue;

    if (!fileId && !filePath) {
      throw new Error('Either fileId or filePath must be provided');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${PCLOUD_API_URL}${API_ENDPOINTS.DOWNLOAD_FILE}`,
      queryParams: {
        ...(fileId ? { fileid: fileId.toString() } : {}),
        ...(filePath ? { path: filePath } : {}),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as OAuth2PropertyValue).access_token,
      },
      responseType: 'arraybuffer',
    });

    if (response.status === 200) {
      const headers = response.headers || {};
      const contentType = headers['content-type'] || 'application/octet-stream';
      const contentDisposition = headers['content-disposition'];
      
      let filename = 'downloaded_file';
      if (typeof contentDisposition === 'string') {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) {
          filename = match[1];
        }
      }

      return {
        data: response.body,
        contentType,
        filename,
      };
    }

    throw new Error(
      `Failed to download file: ${response.status} ${
        response.body?.error || 'Unknown error'
      }`
    );
  },
}); 