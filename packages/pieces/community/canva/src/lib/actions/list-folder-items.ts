import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';

export const canvaListFolderItems = createAction({
  auth: canvaAuth,
  name: 'list_folder_items',
  displayName: 'List Folder Items',
  description: 'List all items (designs, folders, images) in a folder',
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the folder to list items from',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return (default 50)',
      required: false,
    }),
    continuation: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'Token for pagination (from previous response)',
      required: false,
    }),
  },
  async run(context) {
    const { folderId, limit, continuation } = context.propsValue;
    const accessToken = context.auth.access_token;

    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (continuation) params.append('continuation', continuation);

    const queryString = params.toString();
    const url = `https://api.canva.com/rest/v1/folders/${folderId}/items${queryString ? '?' + queryString : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.body;
  },
});
