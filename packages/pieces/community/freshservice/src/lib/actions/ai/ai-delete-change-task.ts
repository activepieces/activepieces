import { createAction, Property } from '@activepieces/pieces-framework';
import { freshserviceAuth } from '../../../';
import { freshserviceDelete } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiDeleteChangeTask = createAction({
  auth: freshserviceAuth,
  name: 'ai_delete_change_task',
  displayName: 'Delete Change Task (AI)',
  description: 'Deletes a task from a Freshservice change request.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: freshserviceSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a task from a Freshservice change request by numeric change id and task id. Not idempotent — a repeat call on an already-deleted task returns a 404 error.',
    idempotent: false,
  },
  props: {
    change_id: Property.Number({ displayName: 'Change ID', required: true }),
    task_id: Property.Number({ displayName: 'Task ID', required: true }),
  },
  async run(context) {
    const { change_id, task_id } = context.propsValue;
    await freshserviceDelete({ auth: context.auth, endpoint: `changes/${change_id}/tasks/${task_id}`, resourceLabel: 'change task' });
    return { success: true, id: task_id };
  },
});
