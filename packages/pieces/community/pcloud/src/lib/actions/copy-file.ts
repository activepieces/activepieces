import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from '../common/constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const copyFile = createAction({
  name: 'copy-file',
  displayName: 'Copy File',
  description: 'Copy a file to a different location in your pCloud storage',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'ID of the file to copy',
      required: false,
    }),
    filePath: Property.ShortText({
      displayName: 'File Path',
      description: 'Path of the file to copy (e.g., /Documents/file.txt)',
      required: false,
    }),
    destinationPath: Property.ShortText({
      displayName: 'Destination Path',
      description: 'Path where the file should be copied to (e.g., /Backups)',
      required: false,
    }),
    destinationFolderId: Property.Number({
      displayName: 'Destination Folder ID',
      description: 'ID of the folder where the file should be copied to',
      required: false,
    }),
    newName: Property.ShortText({
      displayName: 'New Name',
      description: 'New name for the copied file (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { fileId, filePath, destinationPath, destinationFolderId, newName } = context.propsValue;

    if (!fileId && !filePath) {
      throw new Error('Either fileId or filePath must be provided');
    }

    if (!destinationPath && !destinationFolderId) {
      throw new Error('Either destinationPath or destinationFolderId must be provided');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${PCLOUD_API_URL}${API_ENDPOINTS.COPY_FILE}`,
      queryParams: {
        ...(fileId ? { fileid: fileId.toString() } : {}),
        ...(filePath ? { path: filePath } : {}),
        ...(destinationPath ? { topath: destinationPath } : {}),
        ...(destinationFolderId ? { tofolderid: destinationFolderId.toString() } : {}),
        ...(newName ? { toname: newName } : {}),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as OAuth2PropertyValue).access_token,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(
      `Failed to copy file: ${response.status} ${
        response.body?.error || 'Unknown error'
      }`
    );
  },
}); 