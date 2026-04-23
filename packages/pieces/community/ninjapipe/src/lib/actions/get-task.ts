import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getTask = createAction({
  auth: ninjapipeAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Retrieves a task by ID.',
  props: {
    taskId: Property.ShortText({ displayName: 'Task ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/tasks/${context.propsValue.taskId}` });
    return flattenCustomFields(response.body);
  },
});
