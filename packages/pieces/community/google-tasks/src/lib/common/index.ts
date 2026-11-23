import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
  HttpError,
  HttpResponse,
} from '@activepieces/pieces-common';
import { googleTasksAuth } from '../auth';

export enum TaskStatus {
  NEEDS_ACTION = 'needsAction',
  COMPLETED = 'completed',
}

/**
 * @see https://developers.google.com/tasks/reference/rest/v1/tasklists/list#response-body
 */
export type TasksListResponse = {
  kind: string;
  etag: string;
  nextPageToken: string;
  items: TasksList[];
};

/**
 * @see https://developers.google.com/tasks/reference/rest/v1/tasklists#resource:-tasklist
 */
export type TasksList = {
  kind: string;
  id: string;
  etag: string;
  title: string;
  updated: string;
  selfLink: string;
};

/**
 * @see https://developers.google.com/tasks/reference/rest/v1/tasks#resource:-task
 */
export type Task = {
  kind: 'tasks#task';
  id?: string;
  title: string;
  status: TaskStatus;
  notes?: string;

  /**
   * *Optional* RFC 3339 timestamp of due date of the task
   */
  due?: string;

  /**
   * *Optional* RFC 3339 timestamp of completion.
   * Filled automatically if `status === 'completed'`
   */
  completed?: string;

  /**
   * RFC 3339 timestamp when the task was last updated (server-set, always present on API responses)
   */
  updated?: string;
  deleted?: boolean;
  hidden?: boolean;
};

/**
 * @see https://developers.google.com/tasks/reference/rest/v1/tasks/list#response-body
 */
export type TasksResponse = {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items: Task[];
};

export const googleTasksCommon = {
  baseUrl: `https://tasks.googleapis.com`,

  /**
   * @property Target task list ID where the new task will be created
   */
  tasksList: Property.Dropdown<string,true,typeof googleTasksAuth>({
    displayName: 'Task List',
    auth: googleTasksAuth,
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }

      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      try {
        const tasksLists = await getLists(authProp);

        if (tasksLists.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No task lists found. Create one in Google Tasks first.',
          };
        }

        return {
          disabled: false,
          options: tasksLists.map((list) => {
            return {
              label: list.title,
              value: list.id,
            };
          }),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load task lists. Check your connection.',
        };
      }
    },
  }),
  title: Property.ShortText({
    displayName: 'Title',
    placeholder: 'Call the dentist',
    required: true,
  }),
  notes: Property.LongText({
    displayName: 'Notes',
    required: false,
  }),
  due: Property.DateTime({
    displayName: 'Due Date',
    description: 'Google Tasks keeps the date only; the time is ignored.',
    placeholder: '2026-10-15',
    required: false,
  }),
  completed: Property.Checkbox({
    displayName: 'Completed',
    description: 'Add the task already checked off.',
    required: false,
    defaultValue: false,
  }),
};

export async function getLists(
  authProp: OAuth2PropertyValue
): Promise<TasksList[]> {
  // docs: https://developers.google.com/tasks/reference/rest/v1/tasklists/list
  const lists: TasksList[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/users/@me/lists`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authProp.access_token,
      },
      queryParams: {
        maxResults: '100',
        ...(pageToken ? { pageToken } : {}),
      },
    };
    const response = await httpClient.sendRequest<TasksListResponse>(request);
    lists.push(...(response.body.items ?? []));
    pageToken = response.body.nextPageToken;
  } while (pageToken);
  return lists;
}

export async function getTasks(
  authProp: OAuth2PropertyValue,
  tasklist: string,
  params?: Record<string, string | number | boolean>
): Promise<Task[]> {
  // docs: https://developers.google.com/tasks/reference/rest/v1/tasks/list
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${tasklist}/tasks`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProp.access_token,
    },
    queryParams: params as Record<string, string>,
  };
  const response = await httpClient.sendRequest<TasksResponse>(request);
  return response.body.items ?? [];
}

export async function getAllTasks({
  auth,
  taskListId,
  params,
  deadlineMs,
  startPageToken,
}: {
  auth: OAuth2PropertyValue;
  taskListId: string;
  params?: Record<string, string>;
  deadlineMs?: number;
  startPageToken?: string;
}): Promise<{ tasks: Task[]; complete: boolean; nextPageToken?: string }> {
  const tasks: Task[] = [];
  let pageToken: string | undefined = startPageToken ? startPageToken : undefined;
  do {
    const remainingMs =
      deadlineMs === undefined ? REQUEST_TIMEOUT_MS : deadlineMs - Date.now();
    if (remainingMs <= 0) {
      return { tasks, complete: false, nextPageToken: pageToken };
    }
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      headers: { Accept: 'application/json' },
      timeout: Math.min(REQUEST_TIMEOUT_MS, remainingMs),
      queryParams: {
        ...params,
        maxResults: '100',
        ...(pageToken ? { pageToken } : {}),
      },
    };
    const deadlineGoverned = deadlineMs !== undefined && remainingMs <= REQUEST_TIMEOUT_MS;
    const sent = await sendWithinDeadline({ request, deadlineGoverned, deadlineMs });
    if (sent === DEADLINE_REACHED) {
      return { tasks, complete: false, nextPageToken: pageToken };
    }
    tasks.push(...(sent.body.items ?? []));
    pageToken = sent.body.nextPageToken;
  } while (pageToken);
  return { tasks, complete: true };
}

async function sendWithinDeadline({
  request,
  deadlineGoverned,
  deadlineMs,
}: {
  request: HttpRequest;
  deadlineGoverned: boolean;
  deadlineMs?: number;
}): Promise<HttpResponse<TasksResponse> | typeof DEADLINE_REACHED> {
  try {
    return await httpClient.sendRequest<TasksResponse>(request);
  } catch (error) {
    if (
      deadlineGoverned &&
      deadlineMs !== undefined &&
      Date.now() >= deadlineMs &&
      !(error instanceof HttpError)
    ) {
      return DEADLINE_REACHED;
    }
    throw error;
  }
}

export async function createTask(
  authProp: OAuth2PropertyValue,
  taskListId: string,
  task: Task
) {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${taskListId}/tasks`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProp.access_token,
    },
    body: task,
  };

  return httpClient.sendRequest(request);
}

const REQUEST_TIMEOUT_MS = 20_000;
const DEADLINE_REACHED = 'deadline_reached';
