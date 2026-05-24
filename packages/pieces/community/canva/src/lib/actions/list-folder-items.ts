import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const listFolderItems = createAction({
  auth: canvaAuth,
  name: 'list_folder_items',
  displayName: 'List Folder Items',
  description: 'List the designs and assets inside a Canva folder.',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder. Use "root" to list items in the root folder.',
      required: true,
      defaultValue: 'root',
    }),
    item_types: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Type',
      description: 'Only return items of these types. Leave empty to return all.',
      required: false,
      options: {
        options: [
          { label: 'Design', value: 'design' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Folder', value: 'folder' },
        ],
      },
    }),
    continuation: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'Token for fetching the next page of results.',
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, string> = {};
    if (context.propsValue.item_types?.length) {
      params['item_types'] = context.propsValue.item_types.join(',');
    }
    if (context.propsValue.continuation) {
      params['continuation'] = context.propsValue.continuation;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.canva.com/rest/v1/folders/${context.propsValue.folder_id}/items`,
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
