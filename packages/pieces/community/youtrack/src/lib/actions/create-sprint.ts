import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { boardDropdown, SPRINT_FIELDS, sprintRow, yesNoDropdown, yesNoFlag } from '../common';
import { youtrackClient } from '../common/client';
import { createSprintActionOutputSchema } from '../output-schemas';

export const createSprintAction = createAction({
  auth: youtrackAuth,
  name: 'create_sprint',
  classification: 'WRITE',
  outputSchema: createSprintActionOutputSchema,
  displayName: 'Create Sprint',
  description: 'Creates a sprint on an agile board.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a sprint on an agile board (board ID from List Agile Boards) with a name and optional goal, start and finish dates (YYYY-MM-DD or ISO-8601 with a time zone). Sprint names must be unique on a board: a repeat with the same name fails (HTTP 400 "Sprint is not unique"), so check List Sprints first. Not idempotent.',
    idempotent: false,
  },
  props: {
    board: boardDropdown,
    name: Property.ShortText({ displayName: 'Name', description: 'Sprint name, like "Sprint 12".', required: true }),
    goal: Property.LongText({ displayName: 'Goal', description: 'Optional sprint goal.', required: false }),
    start: Property.ShortText({ displayName: 'Start Date', description: 'Optional start: YYYY-MM-DD (midnight UTC) or an ISO-8601 date-time with a time zone, like 2026-12-01T09:00:00Z.', required: false }),
    finish: Property.ShortText({ displayName: 'Finish Date', description: 'Optional finish: YYYY-MM-DD (midnight UTC) or an ISO-8601 date-time with a time zone.', required: false }),
    isDefault: yesNoDropdown({ displayName: 'Default Sprint', description: 'Yes makes this the default sprint for new issues on the board. Leave empty for the YouTrack default.' }),
  },
  async run(context) {
    const name = youtrackClient.optionalText(context.propsValue.name);
    if (name === undefined) {
      throw new Error('Name is required.');
    }
    const start = youtrackClient.parseDateOrDateTime({ value: context.propsValue.start, label: 'Start Date' });
    const finish = youtrackClient.parseDateOrDateTime({ value: context.propsValue.finish, label: 'Finish Date' });
    if (start !== undefined && finish !== undefined && finish < start) {
      throw new Error('Finish Date must be after Start Date.');
    }
    const body: Record<string, unknown> = { name };
    const goal = youtrackClient.optionalText(context.propsValue.goal);
    if (goal !== undefined) body['goal'] = goal;
    if (start !== undefined) body['start'] = start;
    if (finish !== undefined) body['finish'] = finish;
    const isDefault = yesNoFlag(context.propsValue.isDefault);
    if (isDefault !== undefined) body['isDefault'] = isDefault;
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/agiles/${youtrackClient.segment({ value: context.propsValue.board, label: 'Agile Board' })}/sprints`,
      query: { fields: SPRINT_FIELDS },
      body,
      operation: 'create the sprint',
    });
    return sprintRow(youtrackClient.recordOf(response));
  },
});
