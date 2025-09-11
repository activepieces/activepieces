import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ForeplayAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findBoard = createAction({
  auth: ForeplayAuth,
  name: 'findBoard',
  displayName: 'Find Board',
  description: 'Find boards associated with the authenticated user, with optional filtering.',
  props: {
    boardId: Property.ShortText({
      displayName: 'Board ID',
      description: 'Filter by specific board ID (optional)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Board Name',
      description: 'Filter boards by name (optional)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Board Status',
      description: 'Filter boards by status (optional)',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort results by',
      required: false,
      options: {
        options: [
          { label: 'Created (Newest First)', value: 'created_desc' },
          { label: 'Created (Oldest First)', value: 'created_asc' },
          { label: 'Name (A-Z)', value: 'name_asc' },
          { label: 'Name (Z-A)', value: 'name_desc' },
          { label: 'Updated (Recent First)', value: 'updated_desc' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Results Limit',
      description: 'Maximum number of boards to return',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { boardId, name, status, sortBy, limit } = propsValue;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (boardId) {
      queryParams.append('boardId', boardId);
    }

    if (name) {
      queryParams.append('name', name);
    }

    if (status) {
      queryParams.append('status', status);
    }

    if (sortBy) {
      queryParams.append('sort', sortBy);
    }

    if (limit !== undefined && limit !== null) {
      queryParams.append('limit', limit.toString());
    }


    const endpoint = '/boards';
    const queryString = queryParams.toString();

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      queryString ? `${endpoint}?${queryString}` : endpoint
    );

    return response;

  },
});
