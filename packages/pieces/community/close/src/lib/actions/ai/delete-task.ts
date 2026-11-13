import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeOutputSchemas } from '../../common/output-schemas';

const deleteTask = createAction({
  auth: closeAuth,
  name: 'delete_task',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Task',
  description: 'Permanently delete a task.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes a Close task by ID (task_...). This cannot be undone. Repeating it on a deleted task returns not found.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.deleted,
  props: {
    taskId: Property.ShortText({ displayName: 'Task ID', description: 'task_...', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = closeClient.closeId({ value: propsValue.taskId, label: 'Task ID', prefix: 'task' });
    await closeClient.request({ auth, method: HttpMethod.DELETE, path: `/task/${closeClient.pathId(id)}/` });
    return { deleted: true, id };
  },
});

export { deleteTask };
