import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { planIdDropdown, taskIdDropdown } from '../common/dropdown';

export const deleteTask = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Deletes an existing Planner task by its ID.',

  props: {
    planId: planIdDropdown,
    taskId:taskIdDropdown,
    etag: Property.ShortText({
      displayName: 'ETag',
      description:
        'The ETag of the task (use GET /planner/tasks/{taskId} to retrieve it). Required for concurrency control.',
      required: true,
    }),
  },

  async run(context) {
    const { taskId, etag } = context.propsValue;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () =>
          Promise.resolve((context.auth as { access_token: string }).access_token),
      },
    });
   
      const response=await client
        .api(`/planner/tasks/${taskId}`)
        .header('If-Match', etag)
        .delete();

      return response;
 
  },
});
