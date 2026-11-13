import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getTask = createAction({
  auth: ninjapipeAuth,
  name: 'get_task',
  classification: 'READ',
  displayName: 'Get Task',
  description: 'Gets one task of a project.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single task by project ID and task ID. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.task,
  props: {
    projectId: ninjapipeProps.projectRequired(),
    taskId: ninjapipeProps.task(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.getRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/projects/${ninjapipeClient.pathId({ value: p.projectId, field: 'Project' })}/tasks/${ninjapipeClient.pathId({ value: p.taskId, field: 'Task' })}`,
      operation: 'get task',
    });
  },
});
