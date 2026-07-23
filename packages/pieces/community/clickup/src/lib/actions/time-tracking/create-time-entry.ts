import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';

export const clickupCreateTimeEntry = createAction({
  auth: clickupAuth,
  name: 'clickup_create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Create a completed time entry in a ClickUp workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Log a completed (historical) block of tracked time in a ClickUp workspace, given a start time and a duration in milliseconds. Pick this to record time already spent; use Start Time Entry / Stop Time Entry instead to run a live timer. Each call creates a new entry, so retries duplicate (not idempotent). Optionally attach it to a task via its task ID.',
    idempotent: false,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    start: Property.DateTime({
      displayName: 'Start',
      description: 'When the tracked block started.',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (ms)',
      description:
        'Length of the time entry in milliseconds (e.g. 3600000 for one hour).',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional note describing the time entry.',
      required: false,
    }),
    space_id: clickupCommon.space_id(false),
    list_id: clickupCommon.list_id(false),
    task_id: clickupCommon.task_id(
      false,
      'Task to attach the time entry to'
    ),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Mark the time entry as billable.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { workspace_id, start, duration, description, task_id, billable } =
      context.propsValue;
    const auth = getAccessTokenOrThrow(context.auth);

    const body: Record<string, unknown> = {
      start: dayjs(start).valueOf(),
      duration,
      billable,
    };
    if (description) body['description'] = description;
    if (task_id) body['tid'] = task_id;

    const response = await callClickUpApi(
      HttpMethod.POST,
      `team/${workspace_id}/time_entries`,
      auth,
      body
    );

    return response.body;
  },
});
