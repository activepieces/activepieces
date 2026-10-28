import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall, dueFields, flatten, withoutBlanks } from '../common/client';
import { priorityDropdown, TASK_STATUSES, TASK_TYPES, taskDropdown } from '../common/props';

export const updateTask = createAction({
  auth: callsyncAuth,
  name: 'update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Updates or completes a CallSync task. Fields left blank keep their saved values.',
  audience: 'both',
  aiMetadata: {
    description:
      'Change an existing CallSync task: mark it completed or cancelled, or change its type, description, due date or priority; blank fields stay unchanged. Sets fields to given values, so safe to retry.',
    idempotent: true,
  },
  props: {
    task: taskDropdown,
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: TASK_STATUSES },
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: { options: TASK_TYPES },
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    due: Property.DateTime({
      displayName: 'Due',
      description: 'The date and time are saved exactly as picked.',
      required: false,
    }),
    priority_id: priorityDropdown(),
  },
  async run(context) {
    const { task, due, ...fields } = context.propsValue;
    const changes = withoutBlanks({ ...fields, ...dueFields(due) });
    if (!Object.keys(changes).length) {
      throw new Error('Nothing to update: fill in at least one field to change.');
    }
    const response = await callsyncApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: 'crm/tasks',
      body: { ...changes, id: task },
    });
    return flatten(response.data);
  },
});
