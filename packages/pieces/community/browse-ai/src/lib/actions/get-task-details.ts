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
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the full record of one previously-run Browse AI scraping task by robot ID and task ID, including its status and any captured/extracted data. Use to check the outcome or pull results of a known task. Requires both the robot ID and the task ID; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    robotId: robotIdDropdown,
    taskId: taskIdDropdown,
  },
  async run(context) {
    const { robotId, taskId } = context.propsValue;

    try {
      const response = await browseAiApiCall({
        auth: { apiKey: context.auth.secret_text },
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
