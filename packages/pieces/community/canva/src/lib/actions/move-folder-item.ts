import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const moveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description:
    'Move a design or asset into a different Canva folder. Useful for organizing completed designs into an "Archive" folder.',
  props: {
    folderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder to move the item into.',
      required: true,
    }),
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'The type of item being moved.',
      required: true,
      options: {
        options: [
          { label: 'Design', value: 'design' },
          { label: 'Asset', value: 'asset' },
        ],
      },
    }),
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the design or asset to move.',
      required: true,
    }),
  },
  async run(context) {
    const { folderId, itemType, itemId } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const body: Record<string, unknown> = {
      items: [
        {
          type: itemType,
          ...(itemType === 'design' ? { design_id: itemId } : { asset_id: itemId }),
        },
      ],
    };

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.POST,
      path: `/folders/${folderId}/items/move`,
      body,
    });

    return response;
  },
});
