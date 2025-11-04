import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browseAiApiCall } from '../common/client';
import { browseAiAuth } from '../common/auth';
import { robotIdDropdown, taskIdDropdown } from '../common/props';

export const getTaskDetailsAction = createAction({
  name: 'get-task-details',
  auth: browseAiAuth,
  displayName: 'Get Task Details',
  description:
    'Retrieves the details of a specific task executed by a Browse AI robot.',
  props: {
    robotId: robotIdDropdown,
    taskId: taskIdDropdown,
  },
  async run(context) {
    const { robotId, taskId } = context.propsValue;

    try {
      const response = await browseAiApiCall({
        auth: { apiKey: context.auth as string },
        method: HttpMethod.GET,
        resourceUri: `/robots/${robotId}/tasks/${taskId}`,
      });

      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          'Task not found. Please verify the Robot ID and Task ID.'
        );
      }

      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      }

      throw new Error(
        `Failed to fetch task details: ${
          error.message || 'Unknown error occurred'
        }`
      );
    }
  },
});
