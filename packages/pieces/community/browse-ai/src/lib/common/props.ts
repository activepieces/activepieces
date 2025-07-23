import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browseAiApiCall } from './client';

interface BrowseAiRobot {
  id: string;
  name: string;
}

interface BrowseAiTask {
  id: string;
  status: string;
  createdAt: string;
}

export const robotIdDropdown = Property.Dropdown({
  displayName: 'Robot',
  description: 'Select a Browse AI robot',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    const { apiKey } = auth as { apiKey: string };

    if (!apiKey) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Browse AI account.',
      };
    }

    let response: { robots: BrowseAiRobot[] };

    try {
      response = await browseAiApiCall({
        auth: { apiKey },
        method: HttpMethod.GET,
        resourceUri: '/robots',
      });
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching robots: ${(e as Error).message}`,
      };
    }

    const robots = Array.isArray(response.robots) ? response.robots : [];

    if (robots.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No robots found in your Browse AI account.',
      };
    }

    return {
      disabled: false,
      options: robots.map((robot) => ({
        label: robot.name,
        value: robot.id,
      })),
    };
  },
});

export const taskIdDropdown = Property.Dropdown({
  displayName: 'Task',
  description: 'Select a task associated with the selected robot',
  required: true,
  refreshers: ['robotId'],
  options: async ({ auth, propsValue }) => {
    const { apiKey } = auth as { apiKey: string };
    const { robotId } = propsValue as { robotId: string };

    if (!apiKey || !robotId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a robot first.',
      };
    }

    let response: { tasks: BrowseAiTask[] };

    try {
      response = await browseAiApiCall({
        auth: { apiKey },
        method: HttpMethod.GET,
        resourceUri: `/robots/${robotId}/tasks`,
      });
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching tasks: ${(e as Error).message}`,
      };
    }

    const tasks = Array.isArray(response.tasks) ? response.tasks : [];

    if (tasks.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No tasks found for this robot.',
      };
    }

    return {
      disabled: false,
      options: tasks.map((task) => ({
        label: `${task.id} (Status: ${task.status})`,
        value: task.id,
      })),
    };
  },
});
