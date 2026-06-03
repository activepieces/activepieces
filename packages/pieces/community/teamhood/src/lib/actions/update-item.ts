import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  boardIdDropdown,
  itemIdDropdown,
  rowIdDropdown,
  statusIdDropdown,
  teamhoodApiCall,
  TeamhoodAuth,
  teamhoodAuth,
  TeamhoodItem,
  userIdDropdown,
  workspaceIdDropdown,
} from '../common';

export const updateItemAction = createAction({
  auth: teamhoodAuth,
  name: 'update_item',
  displayName: 'Update Item',
  description:
    'Update an existing Teamhood item. Only fields you fill in will be updated.',
  props: {
    workspaceId: workspaceIdDropdown(true),
    boardId: boardIdDropdown(false),
    itemId: itemIdDropdown(true),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the item. Leave empty to keep current title.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'New description for the item. Leave empty to keep current description.',
      required: false,
    }),
    rowId: rowIdDropdown(false),
    statusId: statusIdDropdown(false),
    assignedUserId: userIdDropdown({
      displayName: 'Assignee',
      description:
        'New assignee for the item. Leave empty to keep current assignee.',
      required: false,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    estimation: Property.Number({
      displayName: 'Estimation (hours)',
      required: false,
    }),
    budget: Property.Number({
      displayName: 'Budget',
      required: false,
    }),
    progress: Property.Number({
      displayName: 'Progress (%)',
      description: 'Between 0 and 100.',
      required: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed',
      description: 'Mark the item as completed or not.',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Archive or unarchive the item.',
      required: false,
    }),
    milestone: Property.Checkbox({
      displayName: 'Is Milestone',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'List of tag names. This REPLACES the current tags on the item.',
      required: false,
    }),
  },
  async run(context) {
    const {
      itemId,
      title,
      description,
      rowId,
      statusId,
      assignedUserId,
      startDate,
      dueDate,
      estimation,
      budget,
      progress,
      completed,
      archived,
      milestone,
      tags,
    } = context.propsValue;

    const data: Record<string, unknown> = {};
    if (title !== undefined && title !== '') data['title'] = title;
    if (description !== undefined && description !== '')
      data['description'] = description;
    if (rowId) data['rowId'] = rowId;
    if (statusId) data['statusId'] = statusId;
    if (assignedUserId) data['userId'] = assignedUserId;
    if (startDate) data['startDate'] = startDate;
    if (dueDate) data['dueDate'] = dueDate;
    if (estimation !== undefined && estimation !== null)
      data['estimation'] = estimation;
    if (budget !== undefined && budget !== null) data['budget'] = budget;
    if (progress !== undefined && progress !== null)
      data['progress'] = progress;
    if (completed !== undefined) data['completed'] = completed;
    if (archived !== undefined) data['archived'] = archived;
    if (milestone !== undefined) data['milestone'] = milestone;
    if (Array.isArray(tags)) data['tags'] = tags;

    const response = await teamhoodApiCall<TeamhoodItem>({
      auth: context.auth.props as TeamhoodAuth,
      method: HttpMethod.PUT,
      path: `/items/${itemId}`,
      body: { data },
    });

    return response.body;
  },
});
