import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  boardIdDropdown,
  itemIdDropdown,
  teamhoodApiCall,
  TeamhoodAuth,
  teamhoodAuth,
  TeamhoodItem,
  workspaceIdDropdown,
} from '../common';

export const getItemAction = createAction({
  auth: teamhoodAuth,
  name: 'get_item',
  displayName: 'Get Item',
  description: 'Retrieve a single Teamhood item by ID.',
  props: {
    workspaceId: workspaceIdDropdown(true),
    boardId: boardIdDropdown(false),
    itemId: itemIdDropdown(true),
  },
  async run(context) {
    const { itemId } = context.propsValue;
    const response = await teamhoodApiCall<TeamhoodItem>({
      auth: context.auth.props as TeamhoodAuth,
      method: HttpMethod.GET,
      path: `/items/${itemId}`,
    });
    return response.body;
  },
});
