import { createAction, Property } from '@activepieces/pieces-framework';
import { freshserviceAuth } from '../../';
import { freshserviceDelete } from '../common/client';
import { freshserviceCommon } from '../common/props';
import { freshserviceSchemas } from '../common/schemas';

export const deleteChangeTask = createAction({
  auth: freshserviceAuth,
  name: 'delete_change_task',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Change Task',
  description: 'Deletes a task from a change request in Freshservice.',
  audience: 'human',
  outputSchema: freshserviceSchemas.deleted,
  aiMetadata: {
    description: 'Permanently deletes a task from a Freshservice change request, identified by change id and task id. Use to remove a task that should no longer exist. Not idempotent — a repeat call on an already-deleted task returns a 404 error.',
    idempotent: false,
  },
  props: {
    change_id: freshserviceCommon.change(true),
    task_id: Property.Number({
      displayName: 'Task ID',
      description: 'The ID of the task to delete.',
      required: true,
    }),
  },
  async run(context) {
    await freshserviceDelete({ auth: context.auth, endpoint: `changes/${context.propsValue.change_id}/tasks/${context.propsValue.task_id}`, resourceLabel: 'change task' });

    return { success: true, id: context.propsValue.task_id };
  },
});
