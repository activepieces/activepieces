import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
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

export const createItemAction = createAction({
  auth: teamhoodAuth,
  name: 'create_item',
  displayName: 'Create Item',
  description: 'Create a new item (task) in a Teamhood board.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new task item on a Teamhood board, requiring a workspace, board, and title; optionally set assignee, owner, status, row/swimlane, dates, estimation, budget, progress, tags, and milestone/completed flags. Use to add work into Teamhood. Not idempotent — each call creates a separate item.',
    idempotent: false,
  },
  props: {
    workspaceId: workspaceIdDropdown(true),
    boardId: boardIdDropdown(true),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the item.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional description for the item. Plain text or HTML.',
      required: false,
    }),
    rowId: rowIdDropdown(false),
    statusId: statusIdDropdown(false),
    assignedUserId: userIdDropdown({
      displayName: 'Assignee',
      description: 'The user this item is assigned to.',
      required: false,
    }),
    ownerId: userIdDropdown({
      displayName: 'Owner',
      description: 'The user who owns this item.',
      required: false,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'When work on this item should start.',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'When this item is due.',
      required: false,
    }),
    estimation: Property.Number({
      displayName: 'Estimation (hours)',
      description: 'Estimated effort to complete the item, in hours.',
      required: false,
    }),
    budget: Property.Number({
      displayName: 'Budget',
      description: 'Budget allocated for this item.',
      required: false,
    }),
    progress: Property.Number({
      displayName: 'Progress (%)',
      description:
        'Percentage of work completed, between 0 and 100. Leave empty to track progress automatically.',
      required: false,
    }),
    milestone: Property.Checkbox({
      displayName: 'Is Milestone',
      description: 'Mark this item as a milestone.',
      required: false,
      defaultValue: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Mark as Completed',
      description: 'Create the item as already completed.',
      required: false,
      defaultValue: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'List of tag names to attach to the item.',
      required: false,
    }),
  },
  async run(context) {
    const {
      workspaceId,
      boardId,
      title,
      description,
      rowId,
      statusId,
      assignedUserId,
      ownerId,
      startDate,
      dueDate,
      estimation,
      budget,
      progress,
      milestone,
      completed,
      tags,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      title,
      workspaceId,
      boardId,
      isSuspended: false,
      suspendReason: '',
      milestone: milestone ?? false,
      tags: Array.isArray(tags) ? tags : [],
      customFields: [],
      blocking: [],
      waiting: [],
    };

    if (description !== undefined) body['description'] = description;
    if (rowId) body['rowId'] = rowId;
    if (statusId) body['statusId'] = statusId;
    if (assignedUserId) body['assignedUserId'] = assignedUserId;
    if (ownerId) body['ownerId'] = ownerId;
    if (startDate) body['startDate'] = startDate;
    if (dueDate) body['dueDate'] = dueDate;
    if (estimation !== undefined && estimation !== null)
      body['estimation'] = estimation;
    if (budget !== undefined && budget !== null) body['budget'] = budget;
    if (progress !== undefined && progress !== null)
      body['progress'] = progress;
    if (completed !== undefined) body['completed'] = completed;

    const response = await teamhoodApiCall<TeamhoodItem>({
      auth: context.auth.props as TeamhoodAuth,
      method: HttpMethod.POST,
      path: '/items',
      body,
    });

    return response.body;
  },
});
