import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeTasks } from '../common/task-props';
import { ninjapipeSchemas } from '../output-schemas';

export const createTask = createAction({
  auth: ninjapipeAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task in a project.',
  audience: 'human',
  aiMetadata: { description: 'Create a task in a NinjaPipe project. Not idempotent: each call creates another task.', idempotent: false },
  outputSchema: ninjapipeSchemas.task,
  props: {
    projectId: ninjapipeProps.projectRequired(),
    ...ninjapipeTasks.taskProps({ titleRequired: true }),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: `/projects/${ninjapipeClient.pathId({ value: p.projectId, field: 'Project' })}/tasks`,
      body: ninjapipeTasks.taskBody(p),
      operation: 'create task',
    });
  },
});
