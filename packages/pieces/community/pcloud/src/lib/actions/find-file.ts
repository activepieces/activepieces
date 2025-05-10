import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from '../common/constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const findFile = createAction({
  name: 'find-file',
  displayName: 'Find File',
  description: 'Find files in your pCloud storage by name or path',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Name or path of the file to find',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Search Path',
      description: 'Path to search in (e.g., /Documents)',
      required: false,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'ID of the folder to search in',
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
      const files = response.body.metadata.filter((file: any) => {
        return !file.isfolder && file.name.toLowerCase().includes(query.toLowerCase());
      });

      return {
        files,
        count: files.length,
      };
    }

    throw new Error(
      `Failed to find files: ${response.status} ${
        response.body?.error || 'Unknown error'
      }`
    );
  },
}); 