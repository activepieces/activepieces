import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  boardIdDropdown,
  itemIdDropdown,
  teamhoodApiCall,
  TeamhoodAuth,
  teamhoodAuth,
  workspaceIdDropdown,
} from '../common';

export const deleteItemAction = createAction({
  auth: teamhoodAuth,
  name: 'delete_item',
  displayName: 'Delete Item',
  description: 'Permanently delete a Teamhood item.',
  props: {
    workspaceId: workspaceIdDropdown(true),
    boardId: boardIdDropdown(false),
    itemId: itemIdDropdown(true),
  },
  async run(context) {
    const { itemId } = context.propsValue;
    const response = await teamhoodApiCall({
      auth: context.auth.props as TeamhoodAuth,
      method: HttpMethod.DELETE,
      path: `/items/${itemId}`,
    });
    return { id: itemId as string, deleted: true };
  },
});
