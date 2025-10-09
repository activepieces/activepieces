import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';

export const findPlannerTask = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'find_planner_task',
  displayName: 'Find Planner Task',
  description: 'Retrieve details about a specific Planner task by its ID.',

  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to retrieve.',
      required: true,
    }),
  },

  async run(context) {
    const accessToken = (context.auth as { access_token: string }).access_token;
    const { taskId } = context.propsValue;

    const url = `/planner/tasks/${taskId}`;

   
      const response = await makeRequest(accessToken, HttpMethod.GET, url);

      return {
        success: true,
        message: `Planner task with ID ${taskId} retrieved successfully.`,
        task: response,
      };
    
  },
});
