import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deleteTask = createAction({
  auth: ninjapipeAuth,
  name: 'delete_task',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Task',
  description: 'Permanently deletes a task from a project.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one task by project ID and task ID. Cannot be undone. A second call fails with 404 because the task is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    projectId: ninjapipeProps.projectRequired(),
    taskId: ninjapipeProps.task(),
  },
  async run(context) {
    const p = context.propsValue;
    const taskId = ninjapipeClient.pathId({ value: p.taskId, field: 'Task' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/projects/${ninjapipeClient.pathId({ value: p.projectId, field: 'Project' })}/tasks/${taskId}`,
      id: decodeURIComponent(taskId),
      operation: 'delete task',
    });
  },
});
