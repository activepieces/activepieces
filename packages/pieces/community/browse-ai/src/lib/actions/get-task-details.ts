import { createAction, Property } from '@activepieces/pieces-framework';
import { browseAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { robotIdDropdown, taskIdDropdown } from '../common/props';

export const getTaskDetails = createAction({
  auth: browseAiAuth,
  name: 'getTaskDetails',
  displayName: 'Get Task Details',
  description: '',
  props: {
    robotId: robotIdDropdown,
    taskId: taskIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { robotId, taskId } = propsValue;

    if (!auth || !robotId || !taskId) {
      throw new Error('Authentication, robot ID, and task ID are required');
    }
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/robots/${robotId}/tasks/${taskId}`
    );
    if (!response) {
      throw new Error('Failed to fetch task details');
    }
    
    return {
      taskDetails: response,
    };
  },
});
