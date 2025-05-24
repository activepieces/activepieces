import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from '../common/constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const createFolder = createAction({
  name: 'create-folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in your pCloud storage',
  props: {
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name of the folder to create',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Parent Path',
      description: 'Path to the parent folder (e.g., /Projects)',
      required: false,
    }),
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'ID of the parent folder',
      required: false,
    }),
  },
  async run(context) {
    const { name, path, parentFolderId } = context.propsValue;

    if (!path && !parentFolderId) {
      throw new Error('Either path or parentFolderId must be provided');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${PCLOUD_API_URL}${API_ENDPOINTS.CREATE_FOLDER}`,
      queryParams: {
        ...(path ? { path: `${path}/${name}` } : {}),
        ...(parentFolderId ? { folderid: parentFolderId.toString(), name } : {}),
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
      `Failed to create folder: ${response.status} ${
        response.body?.error || 'Unknown error'
      }`
    );
  },
}); 