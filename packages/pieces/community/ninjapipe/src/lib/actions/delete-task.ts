import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteTask = createAction({
  auth: ninjapipeAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Deletes a task by ID.',
  props: {
    taskId: Property.ShortText({ displayName: 'Task ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/tasks/${context.propsValue.taskId}` });
    return { success: true, deleted_id: context.propsValue.taskId };
  },
});
