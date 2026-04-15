import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { isNotUndefined, pickBy } from '@activepieces/shared';
import {
  TodoistCompletedTask,
  TodoistCreateTaskRequest,
  TodoistProject,
  TodoistSection,
  TodoistTask,
  TodoistUpdateTaskRequest,
} from '../models';

const API = 'https://api.todoist.com/api/v1';

type PaginatedResponse<T> = {
  results: T[];
  next_cursor: string | null;
};

async function fetchAllPages<T>(
  token: string,
  url: string,
  baseParams: Record<string, string | undefined> = {},
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;

  do {
    const queryParams = pickBy(
      { ...baseParams, cursor: cursor ?? undefined },
      isNotUndefined,
    );

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams,
    };

    const response = await httpClient.sendRequest<PaginatedResponse<T>>(request);
    items.push(...response.body.results);
    cursor = response.body.next_cursor;
  } while (cursor);

  return items;
}

export const todoistRestClient = {
  projects: {
    async list({ token }: ProjectsListParams): Promise<TodoistProject[]> {
      return fetchAllPages<TodoistProject>(token, `${API}/projects`);
    },
  },

  sections: {
    async list({ token, project_id }: SectionsListParams): Promise<TodoistSection[]> {
      return fetchAllPages<TodoistSection>(token, `${API}/sections`, { project_id });
    },
  },

  tasks: {
    async create({
      token,
      project_id,
      content,
      description,
      labels,
      priority,
      due_date,
      section_id,
    }: TasksCreateParams): Promise<TodoistTask> {
      const body: TodoistCreateTaskRequest = {
        content,
        project_id,
        description,
        labels,
        priority,
        section_id,
        ...dueDateParams(due_date),
      };

      const request: HttpRequest<TodoistCreateTaskRequest> = {
        method: HttpMethod.POST,
        url: `${API}/tasks`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
        body,
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    },

    async update(params: TasksUpdateParams): Promise<TodoistTask> {
      const body: TodoistUpdateTaskRequest = {
        content: params.content,
        description: params.description,
        labels: params.labels?.length === 0 ? undefined : params.labels,
        priority: params.priority,
        ...dueDateParams(params.due_date),
      };

      const request: HttpRequest<TodoistUpdateTaskRequest> = {
        method: HttpMethod.POST,
        url: `${API}/tasks/${params.task_id}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token: params.token },
        body,
      };

      const response = await httpClient.sendRequest<TodoistTask>(request);
      return response.body;
    },

    async list({ token, project_id, filter }: TasksListParams): Promise<TodoistTask[]> {
      return fetchAllPages<TodoistTask>(token, `${API}/tasks`, { project_id, filter });
    },

    async close({ token, task_id }: { token: string; task_id: string }) {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${API}/tasks/${task_id}/close`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      };

      const response = await httpClient.sendRequest(request);
      return response.body;
    },

    async listCompleted({ token, since, until, project_id }: CompletedListParams): Promise<TodoistCompletedTask[]> {
      const tasks: TodoistCompletedTask[] = [];
      let cursor: string | null = null;

      do {
        const queryParams = pickBy(
          { since, until, project_id, limit: '200', cursor: cursor ?? undefined },
          isNotUndefined,
        );

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${API}/tasks/completed`,
          authentication: { type: AuthenticationType.BEARER_TOKEN, token },
          queryParams,
        };

        const response = await httpClient.sendRequest<{ items: TodoistCompletedTask[]; next_cursor: string | null }>(request);
        tasks.push(...response.body.items);
        cursor = response.body.next_cursor;
      } while (cursor);

      return tasks;
    },
  },
};

type ProjectsListParams = {
  token: string;
};

type SectionsListParams = {
  token: string;
  project_id?: string;
};

type TasksCreateParams = {
  token: string;
} & TodoistCreateTaskRequest;

type TasksUpdateParams = {
  token: string;
  task_id: string;
} & TodoistUpdateTaskRequest;

type TasksListParams = {
  token: string;
  project_id?: string | undefined;
  filter?: string | undefined;
};

type CompletedListParams = {
  token: string;
  since: string;
  until: string;
  project_id?: string | undefined;
};

const dueDateParams = (dueDate?: string) => {
  if (dueDate) {
    const parsedDate = Date.parse(dueDate);
    if (isNaN(parsedDate)) {
      return { due_string: dueDate };
    } else if (/\d{4}-\d{2}-\d{2}/.test(dueDate)) {
      return { due_date: dueDate };
    } else {
      return { due_datetime: new Date(parsedDate).toISOString() };
    }
  }
  return {};
};
