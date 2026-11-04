import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { freshserviceApiCall, pickFields } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiCreateChangeTask = createAction({
  auth: freshserviceAuth,
  name: 'ai_create_change_task',
  displayName: 'Create Change Task (AI)',
  description: 'Adds a task to a Freshservice change request.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.task,
  aiMetadata: {
    description:
      'Adds a task to a Freshservice change request by numeric change id (from List Changes). Requires a title; agent and group ids come from List Agents and List Groups. Not idempotent — each call creates another task.',
    idempotent: false,
  },
  props: {
    change_id: Property.Number({ displayName: 'Change ID', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    agent_id: Property.Number({ displayName: 'Agent ID', required: false }),
    group_id: Property.Number({ displayName: 'Group ID', required: false }),
    status: Property.Number({ displayName: 'Status', description: '1 Open, 2 In Progress, 3 Completed.', required: false }),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'ISO 8601 date-time.', required: false }),
    notify_before: Property.Number({ displayName: 'Notify Before (seconds)', required: false }),
  },
  async run(context) {
    const { change_id } = context.propsValue;
    const response = await freshserviceApiCall<{ task: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `changes/${change_id}/tasks`,
      auth: context.auth,
      body: pickFields({ source: context.propsValue, keys: TASK_FIELDS }),
    });
    return response.body.task;
  },
});

const TASK_FIELDS = ['title', 'description', 'agent_id', 'group_id', 'status', 'due_date', 'notify_before'];
