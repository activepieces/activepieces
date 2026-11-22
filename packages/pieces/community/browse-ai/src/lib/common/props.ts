import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browseAiApiCall } from './client';
import { browseAiAuth } from './auth';

export const robotIdDropdown = Property.Dropdown({
  auth: browseAiAuth,
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
        auth: { apiKey: auth.secret_text },
      });

      const robots = response?.robots?.items ?? [];

      if (robots.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No robots found. Create one in Browse AI first.',
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
        placeholder: 'Failed to load robots. Check your connection.',
      };
    }
  },
});

export const taskIdDropdown = Property.Dropdown({
  auth: browseAiAuth,
  displayName: 'Task',
  description: 'The task to look up. Newest first, times in UTC.',
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
      const tasks = await fetchRecentTasks({
        robotId: String(robotId),
        apiKey: auth.secret_text,
      });

      if (tasks.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'This robot has no tasks yet.',
        };
      }

      return {
        disabled: false,
        options: tasks.map((task) => ({
          label: formatTaskLabel(task),
          value: task.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load tasks. Check your connection.',
      };
    }
  },
});

export const robotParameters = Property.DynamicProperties({
  auth: browseAiAuth,
  displayName: 'Input Parameters',
  refreshers: ['robotId'],
  required: true,
  props: async ({ auth, robotId }): Promise<DynamicPropsValue> => {
    if (!auth || !robotId) return {};

    try {
      const response = await browseAiApiCall<BrowseAiRobotResponse>({
        method: HttpMethod.GET,
        resourceUri: `/robots/${robotId}`,
        auth: { apiKey: auth.secret_text },
      });

      const props: DynamicPropsValue = {};

      const params = response.robot.inputParameters ?? [];

      for (const param of params) {
        switch (param.type) {
          case 'number':
            props[param.name] = Property.Number({
              displayName: param.label,
              description: describeNumberDefault(param),
              required: param.required,
            });
            break;
          case 'url':
          case 'text':
          case 'string':
            props[param.name] = Property.ShortText({
              displayName: param.label,
              description: describeTextDefault(param),
              placeholder: textPlaceholder(param),
              required: param.required,
            });
            break;
          case 'select':
            props[param.name] = Property.StaticDropdown({
              displayName: param.label,
              description: describeSelectDefault(param),
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

async function fetchRecentTasks({
  robotId,
  apiKey,
}: {
  robotId: string;
  apiKey: string;
}): Promise<BrowseAiTask[]> {
  const collected: BrowseAiTask[] = [];

  for (let page = 1; page <= MAX_TASK_PAGES; page++) {
    const response = await browseAiApiCall<BrowseAiTasksResponse>({
      method: HttpMethod.GET,
      resourceUri: `/robots/${robotId}/tasks`,
      query: { sort: '-createdAt', page },
      auth: { apiKey },
    });

    const robotTasks = response.result?.robotTasks;
    collected.push(...(robotTasks?.items ?? []));

    if (!robotTasks?.hasMore) {
      break;
    }
  }

  return collected;
}

function formatTaskLabel(task: BrowseAiTask): string {
  const when = task.createdAt
    ? new Date(task.createdAt).toISOString().slice(0, 16).replace('T', ' ')
    : 'Unknown date';
  const status = TASK_STATUS_LABELS[task.status] ?? task.status;
  return `${when} · ${status} · ${task.id.slice(0, 8)}`;
}

function hasTextDefault(param: BrowseAiInputParameter): boolean {
  return (
    typeof param.defaultValue === 'string' && param.defaultValue.length > 0
  );
}

function describeTextDefault(
  param: BrowseAiInputParameter
): string | undefined {
  if (param.required || !hasTextDefault(param)) {
    return undefined;
  }
  return DEFAULT_SENTENCE;
}

function textPlaceholder(param: BrowseAiInputParameter): string | undefined {
  if (
    param.encrypted === true ||
    typeof param.defaultValue !== 'string' ||
    param.defaultValue.length === 0
  ) {
    return undefined;
  }
  return param.defaultValue;
}

function describeNumberDefault(
  param: BrowseAiInputParameter
): string | undefined {
  if (param.required || typeof param.defaultValue !== 'number') {
    return undefined;
  }
  return `Leave empty to use the robot's default (${param.defaultValue}).`;
}

function describeSelectDefault(
  param: BrowseAiInputParameter
): string | undefined {
  if (param.required || !Array.isArray(param.defaultValue)) {
    return undefined;
  }
  const defaults: unknown[] = param.defaultValue;
  const options = param.options ?? [];
  const labels = defaults.flatMap((entry) => {
    const match =
      options.find((option) => option.value === entry) ??
      options.find((option) => option.label === entry);
    return match ? [match.label] : [];
  });
  if (labels.length === 0) {
    return undefined;
  }
  return `Leave empty to use the robot's default (${labels.join(', ')}).`;
}

const MAX_TASK_PAGES = 5;

const DEFAULT_SENTENCE = "Leave empty to use the robot's default.";

const TASK_STATUS_LABELS: Record<string, string> = {
  successful: 'Succeeded',
  failed: 'Failed',
  'in-progress': 'In progress',
};

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

interface BrowseAiInputParameter {
  type: string;
  name: string;
  label: string;
  required: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: unknown;
  encrypted?: boolean;
}

interface BrowseAiRobotResponse {
  robot: {
    id: string;
    name: string;
    inputParameters: BrowseAiInputParameter[];
  };
}
