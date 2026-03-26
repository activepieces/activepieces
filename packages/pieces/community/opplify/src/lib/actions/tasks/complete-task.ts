import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const completeTaskAction = createAction({
  name: 'complete_task',
  displayName: 'Complete Task',
  description: 'Marks a task as done.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to complete',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('tasks/complete', {
      taskId: context.propsValue.taskId,
    });
  },
});
