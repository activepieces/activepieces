import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';

export const deleteTask = createAction({
  auth:MicrosoftPlannerAuth,
  name: 'delete_task',
  displayName: 'Delete Planner Task',
  description: 'Deletes an existing Planner task by its ID.',

  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to delete.',
      required: true,
    }),
    etag: Property.ShortText({
      displayName: 'ETag',
      description: 'The ETag of the task (use GET /planner/tasks/{taskId} to retrieve it).',
      required: true,
    }),
  },

  async run(context) {
    const accessToken = (context.auth as { access_token: string }).access_token;
    const { taskId, etag } = context.propsValue;

    const response = await makeRequest(
      accessToken,
      HttpMethod.DELETE,
      `/planner/tasks/${taskId}`,
      undefined,
      {
        'If-Match': etag,
      }
    );

    return {
      success: true,
      message: `Task with ID ${taskId} deleted successfully.`,
      response,
    };
  },
});
