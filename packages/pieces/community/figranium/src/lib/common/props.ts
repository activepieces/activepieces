import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient, FigraniumTaskListResponse } from './client';

export const taskIdDropdown = Property.Dropdown({
  displayName: 'Task',
  description: 'The task to execute',
  required: true,
  refreshers: ['auth'],
  auth: figraniumAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Figranium account first',
        options: [],
      };
    }
    const response = await figraniumClient<FigraniumTaskListResponse>({
      baseUrl: auth.props.baseUrl,
      apiKey: auth.props.apiKey,
      method: HttpMethod.GET,
      resourceUri: '/api/tasks/list',
    });
    return {
      disabled: false,
      options: response.tasks.map((task) => ({
        label: task.name || task.id,
        value: task.id,
      })),
    };
  },
});
