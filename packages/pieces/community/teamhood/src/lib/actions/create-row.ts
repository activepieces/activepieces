import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  boardIdDropdown,
  teamhoodApiCall,
  TeamhoodAuth,
  teamhoodAuth,
  TeamhoodRow,
  workspaceIdDropdown,
} from '../common';

export const createRowAction = createAction({
  auth: teamhoodAuth,
  name: 'create_row',
  displayName: 'Create Board Row',
  description:
    'Create a new horizontal swimlane row on a Teamhood board.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new horizontal swimlane row on a Teamhood board, requiring a workspace, board, and row title; optional start/end dates position it on the timeline view. Use to add a grouping lane that items can be placed into. Not idempotent — each call creates a separate row.',
    idempotent: false,
  },
  props: {
    workspaceId: workspaceIdDropdown(true),
    boardId: boardIdDropdown(true),
    title: Property.ShortText({
      displayName: 'Row Title',
      description: 'The title for the new swimlane row.',
      required: true,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Optional start date for the row (timeline view).',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Optional end date for the row (timeline view).',
      required: false,
    }),
  },
  async run(context) {
    const { boardId, title, startDate, endDate } = context.propsValue;
    const body: Record<string, unknown> = { boardId, title };
    if (startDate) body['startDate'] = startDate;
    if (endDate) body['endDate'] = endDate;

    const response = await teamhoodApiCall<TeamhoodRow>({
      auth: context.auth.props as TeamhoodAuth,
      method: HttpMethod.POST,
      path: '/rows',
      body,
    });

    return response.body;
  },
});
