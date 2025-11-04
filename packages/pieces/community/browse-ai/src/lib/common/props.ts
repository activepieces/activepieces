import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browseAiApiCall } from './client';

interface BrowseAiRobot {
  id: string;
  name: string;
}

interface BrowseAiTask {
  id: string;
  status: string;
  createdAt?: number;
}

interface BrowseAiTasksResponse {
  statusCode: number;
  messageCode: string;
  result: {
    robotTasks: {
      totalCount: number;
      pageNumber: number;
      hasMore: boolean;
      items: BrowseAiTask[];
    };
  };
}

interface BrowseAiRobotResponse {
  robot: {
    id: string;
    name: string;
    inputParameters: {
      type: string;
      name: string;
      label: string;
      required: boolean;
      options?: { label: string; value: string }[];
    }[];
  };
}

export const robotIdDropdown = Property.Dropdown({
  displayName: 'Robot',
  description: 'Select a robot from your Browse AI account',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Browse AI account first.',
      };
    }

    try {
      const response = await browseAiApiCall<{
        robots: { items: BrowseAiRobot[] };
      }>({
        method: HttpMethod.GET,
        resourceUri: '/robots',
        auth: { apiKey: auth as string },
      });

      const robots = response?.robots?.items ?? [];

      if (robots.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No robots found in your account.',
        };
      }

      return {
        disabled: false,
        options: robots.map((robot) => ({
          label: robot.name,
          value: robot.id,
        })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder:
          'Failed to load robots. Please check your API key and try again.',
      };
    }
  },
});

export const taskIdDropdown = Property.Dropdown({
  displayName: 'Task',
  description: 'Select a task associated with the selected robot',
  required: true,
  refreshers: ['robotId'],
  options: async ({ auth, robotId }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Browse AI account.',
      };
    }

    if (!robotId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a robot first.',
      };
    }

    try {
      const response = await browseAiApiCall<BrowseAiTasksResponse>({
        method: HttpMethod.GET,
        resourceUri: `/robots/${robotId}/tasks`,
        auth: { apiKey: auth as string },
      });

      const tasks = response.result?.robotTasks?.items ?? [];

      if (tasks.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No tasks found for the selected robot.',
        };
      }

      return {
        disabled: false,
        options: tasks.map((task) => {
          const createdDate = task.createdAt
            ? new Date(task.createdAt).toLocaleDateString()
            : 'Unknown date';
          return {
            label: `${task.id} - ${task.status} (${createdDate})`,
            value: task.id,
          };
        }),
      };
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching tasks: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
      };
    }
  },
});

export const robotParameters = Property.DynamicProperties({
  displayName: 'Input Parameters',
  refreshers: ['robotId'],
  required: true,
  props: async ({ auth, robotId }) => {
    if (!auth || !robotId) return {};

    try {
      const response = await browseAiApiCall<BrowseAiRobotResponse>({
        method: HttpMethod.GET,
        resourceUri: `/robots/${robotId}`,
        auth: { apiKey: auth as unknown as string },
      });

      const props: DynamicPropsValue = {};

      const params = response.robot.inputParameters ?? [];

      for (const param of params) {
        switch (param.type) {
          case 'number':
            props[param.name] = Property.Number({
              displayName: param.label,
              required: param.required,
            });
            break;
          case 'url':
          case 'string':
            props[param.name] = Property.ShortText({
              displayName: param.label,
              required: param.required,
            });
            break;
          case 'select':
            props[param.name] = Property.StaticDropdown({
              displayName: param.label,
              required: param.required,
              options: {
                disabled: false,
                options: param.options ? param.options : [],
              },
            });
            break;
          default:
            break;
        }
      }
      return props;
    } catch {
      return {};
    }
  },
});
