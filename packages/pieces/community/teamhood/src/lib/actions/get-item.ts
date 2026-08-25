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
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Teamhood item by its item ID. Use to read the full details of a known item before acting on it. Read-only and idempotent.',
    idempotent: true,
  },
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
