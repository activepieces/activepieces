import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const updateChangeTask = createAction({
  auth: freshserviceAuth,
  name: 'update_change_task',
  displayName: 'Update Change Task',
  description: 'Updates an existing task on a change request in Freshservice.',
  props: {
    change_id: freshserviceCommon.change(true),
    task_id: Property.Number({
      displayName: 'Task ID',
      description: 'The ID of the task to update.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the task.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the task.',
      required: false,
    }),
    agent_id: freshserviceCommon.agent(false),
    group_id: freshserviceCommon.group(false),
    status: freshserviceCommon.taskStatus,
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Task due date and time (ISO 8601, e.g. 2025-01-15T17:00:00Z).',
      required: false,
    }),
    notify_before: Property.Number({
      displayName: 'Notify Before (seconds)',
      description: 'Time in seconds before the due date to send a reminder notification.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const body: Record<string, unknown> = {};

    if (props.title) body['title'] = props.title;
    if (props.description) body['description'] = props.description;
    if (props.agent_id) body['agent_id'] = props.agent_id;
    if (props.group_id) body['group_id'] = props.group_id;
    if (props.status) body['status'] = props.status;
    if (props.due_date) body['due_date'] = props.due_date;
    if (props.notify_before !== null && props.notify_before !== undefined) {
      body['notify_before'] = props.notify_before;
    }

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided to update the task.');
    }

    const response = await freshserviceApiCall<{ task: Record<string, unknown> }>({
      method: HttpMethod.PUT,
      endpoint: `changes/${props.change_id}/tasks/${props.task_id}`,
      auth: context.auth,
      body,
    });

    return response.body.task;
  },
});
