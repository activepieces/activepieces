import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import {
  boardIdDropdown,
  rowIdDropdown,
  statusIdDropdown,
  teamhoodApiCall,
  TeamhoodAuth,
  teamhoodAuth,
  TeamhoodItem,
  userIdDropdown,
  workspaceIdDropdown,
} from '../common';

export const findItemsAction = createAction({
  auth: teamhoodAuth,
  name: 'find_items',
  displayName: 'Find Items',
  description: 'Search for Teamhood items using filters.',
  props: {
    workspaceId: workspaceIdDropdown(false),
    boardId: boardIdDropdown(false),
    rowId: rowIdDropdown(false),
    statusId: statusIdDropdown(false),
    assignedUserId: userIdDropdown({
      displayName: 'Assignee',
      description: 'Only return items assigned to this user.',
      required: false,
    }),
    ownerId: userIdDropdown({
      displayName: 'Owner',
      description: 'Only return items owned by this user.',
      required: false,
    }),
    completed: Property.StaticDropdown({
      displayName: 'Completion Status',
      description: 'Filter by completion. Leave empty to return both.',
      required: false,
      options: {
        options: [
          { label: 'Only completed', value: 'true' },
          { label: 'Only open', value: 'false' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Filter by tag names (OR logic — items matching any of the tags are returned).',
      required: false,
    }),
    createdSince: Property.DateTime({
      displayName: 'Created Since',
      description: 'Only return items created after this UTC date/time.',
      required: false,
    }),
    modifiedSince: Property.DateTime({
      displayName: 'Modified Since',
      description: 'Only return items modified after this UTC date/time.',
      required: false,
    }),
    completedSince: Property.DateTime({
      displayName: 'Completed Since',
      description: 'Only return items completed after this UTC date/time.',
      required: false,
    }),
    includeChildItems: Property.Checkbox({
      displayName: 'Include Sub-items',
      description: 'Include child items (sub-tasks) in the results.',
      required: false,
      defaultValue: false,
    }),
    take: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of items to return. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of items to skip — useful for pagination.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const {
      workspaceId,
      boardId,
      rowId,
      statusId,
      assignedUserId,
      ownerId,
      completed,
      tags,
      createdSince,
      modifiedSince,
      completedSince,
      includeChildItems,
      take,
      skip,
    } = context.propsValue;

    const queryParams: QueryParams = {};
    if (workspaceId) queryParams['WorkspaceId'] = workspaceId as string;
    if (boardId) queryParams['BoardId'] = boardId as string;
    if (rowId) queryParams['RowId'] = rowId as string;
    if (statusId) queryParams['StatusId'] = statusId as string;
    if (assignedUserId)
      queryParams['AssignedUserId'] = assignedUserId as string;
    if (ownerId) queryParams['OwnerId'] = ownerId as string;
    if (completed) queryParams['Completed'] = completed;
    if (createdSince) queryParams['CreatedSince'] = createdSince;
    if (modifiedSince) queryParams['ModifiedSince'] = modifiedSince;
    if (completedSince) queryParams['CompletedSince'] = completedSince;
    if (includeChildItems !== undefined)
      queryParams['IncludeChildItems'] = String(includeChildItems);
    queryParams['Take'] = String(take ?? 100);
    queryParams['Skip'] = String(skip ?? 0);

    const response = await teamhoodApiCall<{ data?: TeamhoodItem[] }>({
      auth: context.auth.props as TeamhoodAuth,
      method: HttpMethod.GET,
      path: '/items',
      queryParams,
    });
    return response.body;
  },
});
