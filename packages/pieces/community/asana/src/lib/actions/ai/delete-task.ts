import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteTaskOutputSchema } from '../../output-schemas';

export const asanaDeleteTaskAction = createAction({
  auth: asanaAuth,
  name: 'delete_task',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Task',
  description: 'Delete an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a task. It moves to the trash of the connected user and can be restored from the Asana app for 30 days, after which it is removed permanently. To finish a task instead, use Update Task with Completed set to Yes. Not idempotent: repeating the call on the same task may fail.',
    idempotent: false,
  },
  outputSchema: asanaDeleteTaskOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task to delete. Obtain it from List Project Tasks, List Assigned Tasks or Search Workspace Objects.',
      required: true,
    }),
  },
  async run(context) {
    const task = context.propsValue.task.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/tasks/${asanaUtils.pathSegment(task)}`,
      operation: 'Delete Task',
    });
    return { success: true, task_gid: task };
  },
});
