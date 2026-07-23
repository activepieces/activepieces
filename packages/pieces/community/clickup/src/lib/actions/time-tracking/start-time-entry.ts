import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';

export const clickupStartTimeEntry = createAction({
  auth: clickupAuth,
  name: 'clickup_start_time_entry',
  displayName: 'Start Time Entry',
  description: 'Start a running timer in a ClickUp workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Start a live running timer in a ClickUp workspace, optionally attached to a task. Pick this to begin tracking time now and later call Stop Time Entry; use Create Time Entry instead to log a completed block with a known duration. Starting a timer is stateful and fails if one is already running, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional note for the running timer.',
      required: false,
    }),
    space_id: clickupCommon.space_id(false),
    list_id: clickupCommon.list_id(false),
    task_id: clickupCommon.task_id(false, 'Task to track time against'),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Mark the tracked time as billable.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { workspace_id, description, task_id, billable } = context.propsValue;
    const auth = getAccessTokenOrThrow(context.auth);

    const body: Record<string, unknown> = { billable };
    if (description) body['description'] = description;
    if (task_id) body['tid'] = task_id;

    const response = await callClickUpApi(
      HttpMethod.POST,
      `team/${workspace_id}/time_entries/start`,
      auth,
      body
    );

    return response.body;
  },
});
