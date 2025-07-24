import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

export const robotIdDropdown = Property.Dropdown({
  displayName: 'Robot ID',
  description: 'Select a robot ID',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const robots = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/robots'
      );
      return {
        disabled: false,
        options: robots.robots.items.map((robot: any) => ({
          label: robot.name,
          value: robot.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
});

export const taskIdDropdown = Property.Dropdown({
  displayName: 'Task ID',
  description: 'Select a task ID',
  required: true,
  refreshers: ['auth', 'robotId'],
  options: async ({ auth, robotId }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a robot first',
      };
    }
    if (!robotId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a robot first',
      };
    }

    try {
      const tasks = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/robots/${robotId}/tasks?page=1`
      );
      return {
        disabled: false,
        options: tasks.tasks.items.map((task: any) => ({
          label: task.name,
          value: task.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading tasks',
      };
    }
  },
});
