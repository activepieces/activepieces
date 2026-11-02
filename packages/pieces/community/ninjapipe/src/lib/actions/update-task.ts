import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeTasks } from '../common/task-props';
import { ninjapipeSchemas } from '../output-schemas';

export const updateTask = createAction({
  auth: ninjapipeAuth,
  name: 'update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Updates a task. Fields left blank keep their value; use Clear Fields to empty them.',
  audience: 'human',
  aiMetadata: { description: 'Update a task in a NinjaPipe project. Only filled fields change. Re-running with the same input gives the same result.', idempotent: true },
  outputSchema: ninjapipeSchemas.task,
  props: {
    projectId: ninjapipeProps.projectRequired(),
    taskId: ninjapipeProps.task(),
    ...ninjapipeTasks.taskProps({ titleRequired: false }),
    clearFields: ninjapipeProps.clearFields({ fields: ninjapipeTasks.TASK_CLEARABLE }),
  },
  async run(context) {
    const p = context.propsValue;
    const path = `/projects/${ninjapipeClient.pathId({ value: p.projectId, field: 'Project' })}/tasks/${ninjapipeClient.pathId({ value: p.taskId, field: 'Task' })}`;
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: ninjapipeTasks.taskBody(p), clear: p.clearFields }), what: 'task' });
    return ninjapipeClient.sendRecord({ auth: ninjapipeClient.readAuth(context.auth), method: HttpMethod.PUT, path, body, operation: 'update task' });
  },
});
