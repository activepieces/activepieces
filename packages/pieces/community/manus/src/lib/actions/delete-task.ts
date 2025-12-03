import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { manusAuth } from '../common/auth';

async function getTasksDropdown(auth: string): Promise<{ label: string; value: string }[]> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.manus.ai/v1/tasks',
      headers: {
        'accept': 'application/json',
        'API_KEY': auth,
      },
      queryParams: {
        limit: '50',
        order: 'desc',
        orderBy: 'created_at',
      },
    });

    const tasks = response.body?.data || [];
    return tasks.map((task: any) => ({
      label: `${task.instructions?.substring(0, 50) || 'Untitled Task'} (${task.status})`,
      value: task.id,
    }));
  } catch (error) {
    return [];
  }
}

export const deleteTask = createAction({
  name: 'delete_task',
  auth: manusAuth,
  displayName: 'Delete Task',
  description: 'Permanently delete a task by its ID. This action cannot be undone.',
  props: {
    taskId: Property.Dropdown({
      auth: manusAuth,
      displayName: 'Task',
      description: 'Select the task to delete',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getTasksDropdown(auth.secret_text) };
      },
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.manus.ai/v1/tasks/${context.propsValue['taskId']}`,
      headers: {
        'accept': 'application/json',
        'API_KEY': context.auth.secret_text,
      },
    });

    return response.body;
  },
});
