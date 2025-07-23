import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browseAiApiCall } from '../common/client';
import { browseAiAuth } from '../common/auth';
import { robotIdDropdown, taskIdDropdown } from '../common/props';

export const getTaskDetails = createAction({
  name: 'get-task-details',
  auth: browseAiAuth,
  displayName: 'Get Task Details',
  description: 'Fetch the details of a specific task executed by a Browse AI robot.',
  props: {
    robotId: robotIdDropdown,
    taskId: taskIdDropdown,
  },
  async run({ propsValue, auth }) {
    const { apiKey } = auth as unknown as { apiKey: string };
    const { robotId, taskId } = propsValue;

    const response = await browseAiApiCall({
      auth: { apiKey },
      method: HttpMethod.GET,
      resourceUri: `/robots/${robotId}/tasks/${taskId}`,
    });

    return response;
  },
});
