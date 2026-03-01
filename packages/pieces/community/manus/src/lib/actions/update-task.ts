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

export const updateTask = createAction({
  name: 'update_task',
  auth: manusAuth,
  displayName: 'Update Task',
  description: 'Update a task\'s metadata such as title, sharing settings, and visibility in the task list',
  props: {
    taskId: Property.Dropdown({
      auth: manusAuth,
      displayName: 'Task',
      description: 'Select the task to update',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getTasksDropdown(auth.secret_text) };
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the task',
      required: false,
    }),
    enableShared: Property.Checkbox({
      displayName: 'Enable Sharing',
      description: 'Whether to enable public sharing',
      required: false,
      defaultValue: false,
    }),
    enableVisibleInTaskList: Property.Checkbox({
      displayName: 'Visible in Task List',
      description: 'Whether the task should be visible in the task list',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const body: Record<string, any> = {};

    if (context.propsValue['title']) {
      body['title'] = context.propsValue['title'];
    }
    if (context.propsValue['enableShared'] !== undefined) {
      body['enableShared'] = context.propsValue['enableShared'];
    }
    if (context.propsValue['enableVisibleInTaskList'] !== undefined) {
      body['enableVisibleInTaskList'] = context.propsValue['enableVisibleInTaskList'];
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.manus.ai/v1/tasks/${context.propsValue['taskId']}`,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'API_KEY': context.auth.secret_text,
      },
      body,
    });

    return response.body;
  },
});
