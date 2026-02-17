import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';

export const canvaMoveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_canva_folder_item',
  description: 'Move an item to a different folder in Canva',
  displayName: 'Move Folder Item',
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the item (design or folder) to move.',
      required: true,
    }),
    to_folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder to move the item into.',
      required: true,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/folders/move',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        item_id: context.propsValue.item_id,
        to_folder_id: context.propsValue.to_folder_id,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
