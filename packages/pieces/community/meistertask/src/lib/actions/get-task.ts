import { createAction, Property } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../auth';

export const getTask = createAction({
  auth: meistertaskAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Get task details',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      required: true,
    }),
  },
  async run(context) {
    const response = await fetch(`https://www.meistertask.com/api/tasks/${context.propsValue.task_id}`, {
      headers: { 'Authorization': `Bearer ${context.auth}` },
    });
    return await response.json();
  },
});
