import { createAction, Property } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../auth';

export const updateTask = createAction({
  auth: meistertaskAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Update an existing task',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      required: false,
    }),
  },
  async run(context) {
    const response = await fetch(`https://www.meistertask.com/api/tasks/${context.propsValue.task_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(context.propsValue.name && { name: context.propsValue.name }),
        ...(context.propsValue.status && { status: context.propsValue.status }),
      }),
    });
    return await response.json();
  },
});
