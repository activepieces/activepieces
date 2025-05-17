import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from '../common/constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const findFolder = createAction({
  name: 'find-folder',
  displayName: 'Find Folder',
  description: 'Find folders in your pCloud storage by name or path',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Name or path of the folder to find',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Search Path',
      description: 'Path to search in (e.g., /Projects)',
      required: false,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'ID of the parent folder to search in',
      required: false,
    }),
  },
  async run(context) {
    const { query, path, folderId } = context.propsValue;

    if (!path && !folderId) {
      throw new Error('Either path or folderId must be provided');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${PCLOUD_API_URL}${API_ENDPOINTS.LIST_FOLDER}`,
      queryParams: {
        ...(path ? { path } : {}),
        ...(folderId ? { folderid: folderId.toString() } : {}),
        timeformat: 'timestamp',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as OAuth2PropertyValue).access_token,
      },
    });

    if (response.status === 200) {
      const folders = response.body.metadata.filter((folder: any) => {
        return folder.isfolder && folder.name.toLowerCase().includes(query.toLowerCase());
      });

      return {
        folders,
        count: folders.length,
      };
    }

    throw new Error(
      `Failed to find folders: ${response.status} ${
        response.body?.error || 'Unknown error'
      }`
    );
  },
}); 