import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumClient } from './client';
import { figraniumAuth, FigraniumAuthType } from '../auth';

type TaskItem = {
  id: string;
  name?: string;
  description?: string;
};

export const taskIdDropdown = Property.Dropdown<string, true>({
  auth: figraniumAuth,
  displayName: 'Task ID',
  description: 'Select a saved task',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Figranium account first',
        options: [],
      };
    }
    const rawAuth = auth as { props?: FigraniumAuthType } & FigraniumAuthType;
    const baseUrl = rawAuth.props?.baseUrl ?? rawAuth.baseUrl;
    const apiKey = rawAuth.props?.apiKey ?? rawAuth.apiKey;
    if (!baseUrl || !apiKey) {
      return {
        disabled: true,
        placeholder: 'Invalid Figranium connection details',
        options: [],
      };
    }
    try {
      const response = await figraniumClient<{ tasks: TaskItem[] }>({
        baseUrl,
        apiKey,
        method: HttpMethod.GET,
        resourceUri: '/api/tasks/list',
      });
      const tasks = response.tasks ?? [];
      return {
        disabled: false,
        options: tasks.map((t) => ({
          label: t.name ? `${t.name} (${t.id})` : t.id,
          value: t.id,
        })),
      };
    } catch (e) {
      return {
        disabled: true,
        placeholder: 'Failed to load tasks',
        options: [],
      };
    }
  },
});
