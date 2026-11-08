import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { freshserviceApiCall, pickFields } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

const TASK_FIELDS = ['title', 'description', 'agent_id', 'group_id', 'status', 'due_date', 'notify_before'];

export const aiUpdateChangeTask = createAction({
  auth: freshserviceAuth,
  name: 'ai_update_change_task',
  displayName: 'Update Change Task (AI)',
  description: 'Updates a task on a Freshservice change request.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.task,
  aiMetadata: {
    description:
      'Updates a task on a Freshservice change request by numeric change id and task id. Only the fields you pass are changed. Idempotent — sending the same values again leaves the task unchanged.',
    idempotent: true,
  },
  props: {
    change_id: Property.Number({ displayName: 'Change ID', required: true }),
    task_id: Property.Number({ displayName: 'Task ID', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    agent_id: Property.Number({ displayName: 'Agent ID', required: false }),
    group_id: Property.Number({ displayName: 'Group ID', required: false }),
    status: Property.Number({ displayName: 'Status', description: '1 Open, 2 In Progress, 3 Completed.', required: false }),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'ISO 8601 date-time.', required: false }),
    notify_before: Property.Number({ displayName: 'Notify Before (seconds)', required: false }),
  },
  async run(context) {
    const { change_id, task_id } = context.propsValue;
    const body = pickFields({ source: context.propsValue, keys: TASK_FIELDS });
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await freshserviceApiCall<{ task: Record<string, unknown> }>({
      method: HttpMethod.PUT,
      endpoint: `changes/${change_id}/tasks/${task_id}`,
      auth: context.auth,
      body,
    });
    return response.body.task;
  },
});
