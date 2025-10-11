import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { planIdDropdown, taskIdDropdown } from '../common/dropdown';

export const findPlannerTask = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'find_planner_task',
  displayName: 'Find Planner Task',
  description: 'Retrieve details about a specific Planner task by its ID.',

  props: {
    planId:planIdDropdown,
    taskId: taskIdDropdown,
  },

  async run(context) {

    const { taskId } = context.propsValue;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () =>
          Promise.resolve((context.auth as { access_token: string }).access_token),
      },
    });
    const response = await client
      .api(`/planner/tasks/${taskId}`)
      .get();

    return response;

  },
});
