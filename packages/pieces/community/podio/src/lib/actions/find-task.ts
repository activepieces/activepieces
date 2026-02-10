import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicTaskProperty } from '../common';

export const findTaskAction = createAction({
  auth: podioAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Retrieve a task by ID for further updates.',
  props: {
    taskId: dynamicTaskProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { taskId } = context.propsValue;

    if (!taskId) {
      throw new Error('Task selection is required. Please select a task from the dropdown.');
    }

    const response = await podioApiCall<any>({
      method: HttpMethod.GET,
      accessToken,
      resourceUri: `/task/${taskId}`,
    });

    return response;
  },
}); 