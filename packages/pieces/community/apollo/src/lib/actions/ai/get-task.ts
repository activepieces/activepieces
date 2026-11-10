import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiGetTaskAction = createAction({
  auth: apolloAuth,
  name: 'ai_get_task',
  classification: 'READ',
  displayName: 'Get Task',
  description: 'Get one task by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Apollo task by task ID with type, status, priority, due date, note, assignee and linked contact, account and deal IDs. Uses no credits.',
    idempotent: true,
  },
  props: {
    task_id: aiProps.id({ displayName: 'Task ID', description: 'Task ID from Search Tasks or Create Task (field id).' }),
  },
  outputSchema: apolloOutputSchemas.task,
  async run({ propsValue, auth }) {
    const body = await apolloRequests.getTask({ apiKey: apiKeyOf(auth), taskId: apolloInputs.requireText({ value: propsValue.task_id, label: 'Task ID' }) });
    return { task: apolloMappers.task(body['task']) };
  },
});
