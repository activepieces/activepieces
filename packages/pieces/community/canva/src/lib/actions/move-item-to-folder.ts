import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const moveItemToFolder = createAction({
  auth: canvaAuth,
  name: 'move_item_to_folder',
  displayName: 'Move Item to Folder',
  description: 'Move a design or asset to a different folder.',
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the design or asset to move.',
      required: true,
    }),
    item_type: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'Whether the item is a design or an asset.',
      required: true,
      defaultValue: 'design',
      options: {
        options: [
          { label: 'Design', value: 'design' },
          { label: 'Asset', value: 'asset' },
        ],
      },
    }),
    to_folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'ID of the folder to move the item into.',
      required: true,
    }),
    from_folder_id: Property.ShortText({
      displayName: 'Source Folder ID',
      description: 'ID of the current parent folder. Use "root" if the item is in the root.',
      required: true,
      defaultValue: 'root',
    }),
  },
  async run(context) {
    const { item_id, item_type, to_folder_id, from_folder_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.canva.com/rest/v1/folders/${to_folder_id}/items/move`,
      body: {
        items: [{ type: item_type, id: item_id }],
        from_folder_id,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
