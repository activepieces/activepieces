import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaApiRequest, listFoldersForDropdown } from '../common';

export const moveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move a design or asset from one folder to another.',
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the design or asset to move.',
      required: true,
    }),
    toFolderId: Property.Dropdown({
      auth: canvaAuth,
      displayName: 'Destination Folder',
      description: 'The folder to move the item into. Select "Root (Projects)" to move to the top level.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, placeholder: 'Connect your Canva account first.', options: [] };
        const options = await listFoldersForDropdown(auth as any);
        return { disabled: false, options };
      },
    }),
  },
  async run(context) {
    return canvaApiRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/folders/move',
      {
        item_id: context.propsValue.itemId,
        to_folder_id: context.propsValue.toFolderId,
      },
    );
  },
});
