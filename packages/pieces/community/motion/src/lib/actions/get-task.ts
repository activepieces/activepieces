import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';

export const getTask = createAction({
  auth: motionAuth,
  name: 'get-task',
  displayName: 'Get Task',
  description: 'Get details of a specific task by ID',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await fetch(`https://api.usemotion.com/v1/tasks/${propsValue.taskId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': auth,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get task: ${error.message || response.statusText}`);
    }

    return await response.json();
  },
});
