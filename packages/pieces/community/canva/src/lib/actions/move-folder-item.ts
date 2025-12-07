import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const moveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move items between folders',
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the item to move',
      required: true,
    }),
    to_folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the destination folder (use "root" for top level)',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const itemId = context.propsValue.item_id;
    const toFolderId = context.propsValue.to_folder_id;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${canvaCommon.baseUrl}/${canvaCommon.foldersMove}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        item_id: itemId,
        to_folder_id: toFolderId,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: true,
      status: response.status,
    };
  },
});
